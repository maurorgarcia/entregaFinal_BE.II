const nodemailer = require("nodemailer");
const config = require("../config/config");

class MailService {
  constructor() {
    this.transporter = null;
  }

  isConfigured() {
    return Boolean(config.mail.user && config.mail.pass);
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: config.mail.service,
        auth: { user: config.mail.user, pass: config.mail.pass }
      });
    }
    return this.transporter;
  }

  async send({ to, subject, html }) {
    // Sin credenciales SMTP (desarrollo) mostramos el enlace por consola en vez de enviar el mail
    if (!this.isConfigured()) {
      console.log(`[MailService] MAIL_USER/MAIL_PASS sin configurar. Mail simulado para ${to}: ${subject}`);
      const link = html.match(/href="([^"]+)"/);
      if (link) console.log(`[MailService] Enlace: ${link[1]}`);
      return { simulated: true };
    }
    return this.getTransporter().sendMail({ from: config.mail.from, to, subject, html });
  }

  sendPasswordReset(to, name, link) {
    return this.send({
      to,
      subject: "Restablecer tu contraseña",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2>Hola ${name}</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el botón para elegir una nueva.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${link}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Restablecer contraseña</a>
          </p>
          <p>El enlace vence en <strong>1 hora</strong>. Si no pediste este cambio, ignorá este correo.</p>
        </div>`
    });
  }

  sendPurchaseTicket(to, ticket) {
    const rows = ticket.items.map(item => `<li>${item.quantity} x ${item.title} - $${item.price}</li>`).join("");
    return this.send({
      to,
      subject: `Compra confirmada - ${ticket.code}`,
      html: `<h2>¡Gracias por tu compra!</h2><p>Ticket: <strong>${ticket.code}</strong></p><ul>${rows}</ul><p>Total: <strong>$${ticket.amount}</strong></p>`
    });
  }
}

module.exports = new MailService();
