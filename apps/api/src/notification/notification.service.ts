import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import * as nodemailer from "nodemailer";
import * as QRCode from "qrcode";
import { PrismaService } from "../prisma/prisma.service";

type Transporter = nodemailer.Transporter | null;

interface BookingForEmail {
  id: string;
  guestEmail: string;
  guestName: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: any;
  paymentMethod?: string;
  roomNumber?: string | null;
  roomType?: { name: string; imageUrls?: string[] | null } | null;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly resend: Resend | null;
  private readonly smtp: Transporter;
  private readonly from: string;
  private readonly adminEmail: string;
  private readonly currency: string;
  /** Which provider is active — used in logs + tests */
  private readonly provider: "smtp" | "resend" | "none";

  constructor(private readonly prisma: PrismaService) {
    this.from = process.env.EMAIL_FROM ?? "PMS <noreply@example.com>";
    this.adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? "";
    this.currency = process.env.CURRENCY ?? "THB";

    // Provider precedence: SMTP > Resend > log-only
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.smtp = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.resend = null;
      this.provider = "smtp";
      this.logger.log(
        `📨 Email provider: SMTP (${process.env.SMTP_HOST}) — sending real emails`,
      );
    } else if (process.env.RESEND_API_KEY) {
      this.smtp = null;
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.provider = "resend";
      this.logger.log("📨 Email provider: Resend");
    } else {
      this.smtp = null;
      this.resend = null;
      this.provider = "none";
      this.logger.warn(
        "📨 No email provider configured — emails will be logged only",
      );
    }
  }

  /**
   * Send booking-confirmed email to BOTH:
   *   1. The guest's email (the one they entered when booking)
   *   2. The admin notification email (from env / site settings)
   *
   * Both messages contain the same hotel-style "ticket" with full booking details.
   * Subject prefixes differ so admins can filter their copies.
   */
  async sendBookingConfirmed(booking: BookingForEmail) {
    const site = await this.getSite();
    const hotelName = site?.hotelName ?? "Hotel";
    const subject = `✓ ยืนยันการจอง #${booking.id.slice(0, 8)} — ${hotelName}`;

    // Generate QR code for the booking — staff can scan at check-in
    const webUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const ticketUrl = `${webUrl}/booking/${booking.id}/confirmation`;
    const qrDataUrl = await QRCode.toDataURL(ticketUrl, {
      margin: 1,
      width: 200,
      errorCorrectionLevel: "M",
    });

    const html = this.ticketHtml(booking, site, qrDataUrl, ticketUrl);

    // Send only to the guest's email (the one entered at booking time)
    await this.send(booking.guestEmail, subject, html);
  }

  // ---------------------------------------------------------------------------
  // private
  // ---------------------------------------------------------------------------

  private async getSite() {
    try {
      return await this.prisma.siteSetting.findUnique({
        where: { id: "default" },
      });
    } catch {
      return null;
    }
  }

  private async send(to: string, subject: string, html: string) {
    // Dev override: redirect every email to one inbox for testing.
    const devOverride = process.env.DEV_EMAIL_TO;
    const finalTo = devOverride || to;
    const finalSubject = devOverride ? `[dev→${to}] ${subject}` : subject;

    // ── SMTP (Gmail / Brevo / any provider) ────────────────────────────
    if (this.smtp) {
      try {
        const info = await this.smtp.sendMail({
          from: this.from,
          to: finalTo,
          subject: finalSubject,
          html,
        });
        this.logger.log(`✉ [SMTP] sent to ${finalTo} (id=${info.messageId})`);
      } catch (e: any) {
        this.logger.error(`SMTP send failed to ${finalTo}: ${e.message}`);
      }
      return;
    }

    // ── Resend ─────────────────────────────────────────────────────────
    if (this.resend) {
      try {
        const r: any = await this.resend.emails.send({
          from: this.from,
          to: finalTo,
          subject: finalSubject,
          html,
        });
        if (r?.error) {
          this.logger.error(
            `Resend rejected email to ${finalTo}: ${JSON.stringify(r.error)}`,
          );
        } else {
          this.logger.log(
            `✉ [Resend] sent to ${finalTo} (id=${r?.data?.id ?? "?"})`,
          );
        }
      } catch (e: any) {
        this.logger.error(`Resend send failed to ${finalTo}: ${e.message}`);
      }
      return;
    }

    // ── No provider — log-only stub ────────────────────────────────────
    this.logger.warn(
      `[email NOT SENT — no provider configured] would send to=${finalTo} subject="${finalSubject}"`,
    );
  }

  private fmtDate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  private fmtMoney(v: any) {
    return Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  private nightCount(ci: Date, co: Date) {
    return Math.round((+co - +ci) / (1000 * 60 * 60 * 24));
  }

  /**
   * Hotel-ticket email template — table-based for max email-client compatibility.
   * Designed as a "boarding pass": main pass + perforated stub with QR code
   * that guests show at check-in.
   */
  private ticketHtml(
    b: BookingForEmail,
    site: any | null,
    qrDataUrl: string,
    ticketUrl: string,
  ): string {
    const hotelName = site?.hotelName ?? "Hotel";
    const tagline = site?.brandTagline ?? "";
    const address = site?.contactAddress ?? "";
    const phone = site?.contactPhone ?? "";
    const contactEmail = site?.contactEmail ?? "";
    const checkInTime = site?.checkInTime ?? "From 14:00";
    const checkOutTime = site?.checkOutTime ?? "Before 12:00";
    const policy =
      site?.cancellationPolicy ??
      "All sales final — no refunds.";

    const nights = this.nightCount(b.checkIn, b.checkOut);
    const totalNum = Number(b.totalPrice);
    const vatPct = Number(site?.vatPercent ?? 0);
    const vatLabel = site?.vatLabel ?? "VAT";
    const vatAmount = vatPct > 0 ? (totalNum * vatPct) / (100 + vatPct) : 0;
    const subtotal = totalNum - vatAmount;
    const total = this.fmtMoney(totalNum);
    const roomName = b.roomType?.name ?? "—";
    const heroImg = b.roomType?.imageUrls?.[0];
    const shortId = b.id.slice(0, 8).toUpperCase();

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Booking Confirmation</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.06);max-width:600px;">
            <!-- HEADER -->
            <tr>
              <td style="background:#0f766e;padding:28px 32px;color:#ffffff;">
                <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:2px;font-weight:600;">
                  ${hotelName.toUpperCase()}
                  ${tagline ? `<span style="font-size:11px;letter-spacing:4px;color:#ccfbf1;margin-left:6px;">${tagline}</span>` : ""}
                </div>
                <div style="margin-top:8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#99f6e4;">
                  Booking Confirmation
                </div>
              </td>
            </tr>

            ${
              heroImg
                ? `<tr><td><img src="${heroImg}" alt="${roomName}" style="display:block;width:100%;height:200px;object-fit:cover;" /></td></tr>`
                : ""
            }

            <!-- SUCCESS BANNER -->
            <tr>
              <td style="padding:24px 32px 8px;text-align:center;">
                <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background:#dcfce7;color:#15803d;line-height:48px;font-size:24px;font-weight:bold;">✓</div>
                <h1 style="font-family:Georgia,serif;font-size:26px;margin:14px 0 4px;color:#0f172a;">
                  ยืนยันการจองสำเร็จ
                </h1>
                <p style="margin:0;font-size:14px;color:#64748b;">
                  Hello ${b.guestName} — your reservation is confirmed.
                </p>
              </td>
            </tr>

            <!-- BOARDING-PASS STYLE TICKET -->
            <tr>
              <td style="padding:16px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf6;border-radius:10px;border:2px dashed #d4a574;overflow:hidden;">
                  <tr>
                    <!-- LEFT: booking details -->
                    <td style="padding:18px 18px 18px 22px;vertical-align:top;width:62%;">
                      <div style="font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:#945412;font-weight:700;">
                        Hotel Boarding Pass
                      </div>
                      <div style="font-family:Georgia,serif;font-size:24px;color:#0f172a;margin:6px 0 2px;">
                        ${roomName}
                        ${
                          b.roomNumber
                            ? `<span style="display:inline-block;background:#0f766e;color:#ffffff;font-family:-apple-system,sans-serif;font-size:14px;font-weight:bold;padding:2px 10px;border-radius:6px;margin-left:8px;vertical-align:middle;">Room ${b.roomNumber}</span>`
                            : ""
                        }
                      </div>
                      <div style="font-size:11px;color:#64748b;margin-bottom:14px;">
                        Guest: <b style="color:#0f172a;">${b.guestName}</b>
                      </div>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align:top;width:50%;">
                            <div style="font-size:9px;letter-spacing:2px;color:#94a3b8;font-weight:700;">CHECK-IN</div>
                            <div style="font-family:Georgia,serif;font-size:18px;color:#0f172a;margin-top:2px;">
                              ${this.fmtDateLong(b.checkIn)}
                            </div>
                            <div style="font-size:10px;color:#64748b;">${checkInTime}</div>
                          </td>
                          <td style="vertical-align:top;width:50%;">
                            <div style="font-size:9px;letter-spacing:2px;color:#94a3b8;font-weight:700;">CHECK-OUT</div>
                            <div style="font-family:Georgia,serif;font-size:18px;color:#0f172a;margin-top:2px;">
                              ${this.fmtDateLong(b.checkOut)}
                            </div>
                            <div style="font-size:10px;color:#64748b;">${checkOutTime}</div>
                          </td>
                        </tr>
                      </table>

                      <div style="margin-top:12px;font-size:11px;color:#64748b;">
                        <b style="color:#0f172a;">${nights}</b> night${nights !== 1 ? "s" : ""} · <b style="color:#0f172a;">${total} ${this.currency}</b>
                      </div>
                    </td>

                    <!-- PERFORATED EDGE (vertical dashed border) -->
                    <td style="border-left:2px dashed #d4a574;width:0;padding:0;"></td>

                    <!-- RIGHT: QR stub -->
                    <td style="padding:18px 14px;vertical-align:middle;width:38%;text-align:center;background:#ffffff;">
                      <img src="${qrDataUrl}" alt="QR" width="140" height="140" style="display:block;margin:0 auto;width:140px;height:140px;" />
                      <div style="font-family:'Courier New',monospace;font-size:14px;color:#0f172a;font-weight:bold;letter-spacing:2px;margin-top:8px;">
                        ${shortId}
                      </div>
                      <div style="font-size:9px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;">
                        Show at check-in
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Full booking ID + view button -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                  <tr>
                    <td style="font-size:10px;color:#94a3b8;letter-spacing:1px;">
                      Reference:&nbsp;
                      <span style="font-family:'Courier New',monospace;color:#475569;">${b.id}</span>
                    </td>
                    <td style="text-align:right;">
                      <a href="${ticketUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-size:12px;padding:8px 16px;border-radius:6px;font-weight:600;">
                        View Ticket Online →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- DETAILS -->
            <tr>
              <td style="padding:8px 32px;">
                ${this.detailRow("ROOM TYPE", roomName, true)}
                ${b.roomNumber ? this.detailRow("ROOM #", b.roomNumber) : ""}
                ${this.detailRow("GUEST", b.guestName)}
                ${this.detailRow("EMAIL", b.guestEmail)}
                ${this.detailRow("PHONE", b.guestPhone)}
                ${this.detailRow("PAYMENT", b.paymentMethod ?? "—")}
              </td>
            </tr>

            <!-- TOTAL with VAT breakdown -->
            <tr>
              <td style="padding:16px 32px 8px;">
                ${
                  vatPct > 0
                    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;font-size:13px;color:#475569;">
                  <tr>
                    <td style="padding:4px 6px;">Subtotal</td>
                    <td style="padding:4px 6px;text-align:right;">${this.fmtMoney(subtotal)} ${this.currency}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 6px;">${vatLabel} (${vatPct}%)</td>
                    <td style="padding:4px 6px;text-align:right;">${this.fmtMoney(vatAmount)} ${this.currency}</td>
                  </tr>
                </table>`
                    : ""
                }
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f766e;border-radius:10px;">
                  <tr>
                    <td style="padding:18px 22px;color:#ffffff;">
                      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#ccfbf1;">Total Paid</div>
                      <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-top:2px;font-family:-apple-system,sans-serif;">
                        ${total} <span style="font-size:14px;color:#99f6e4;">${this.currency}</span>
                      </div>
                      ${vatPct > 0 ? `<div style="font-size:10px;color:#99f6e4;margin-top:4px;">includes ${vatLabel} ${vatPct}%</div>` : ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- POLICY -->
            <tr>
              <td style="padding:18px 32px;">
                <div style="background:#fef3c7;border-left:3px solid #d4a574;border-radius:4px;padding:12px 14px;font-size:12px;color:#7a4316;">
                  <b>Policy:</b> ${policy}
                </div>
              </td>
            </tr>

            <!-- CONTACT -->
            <tr>
              <td style="padding:8px 32px 28px;text-align:center;font-size:12px;color:#64748b;line-height:1.6;">
                <div>For any questions, please contact us:</div>
                ${address ? `<div>${address}</div>` : ""}
                ${phone ? `<div>📞 ${phone}</div>` : ""}
                ${contactEmail ? `<div>✉ ${contactEmail}</div>` : ""}
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background:#0f172a;padding:18px 32px;text-align:center;color:#94a3b8;font-size:11px;letter-spacing:0.5px;">
                © ${new Date().getFullYear()} ${hotelName}. Show this email at check-in.
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:11px;color:#94a3b8;">
            This is an automated booking confirmation — please do not reply.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private fmtDateLong(d: Date) {
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  private detailRow(label: string, value: string, first = false) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="${first ? "" : "border-top:1px solid #f1f5f9;"}">
      <tr>
        <td style="padding:10px 0;width:90px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;font-weight:600;vertical-align:top;">${label}</td>
        <td style="padding:10px 0;font-size:14px;color:#0f172a;font-weight:500;">${value}</td>
      </tr>
    </table>`;
  }
}
