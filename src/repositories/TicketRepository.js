const crypto = require("crypto");
const TicketDAO = require("../dao/TicketDAO");

class TicketRepository {
  constructor(dao = new TicketDAO()) {
    this.dao = dao;
  }

  createTicket({ amount, purchaser, items }) {
    return this.dao.create({
      code: `TCK-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      purchase_datetime: new Date(),
      amount,
      purchaser,
      items
    });
  }

  getByPurchaser(email) {
    return this.dao.findByPurchaser(email);
  }
}

module.exports = TicketRepository;
