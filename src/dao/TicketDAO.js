const Ticket = require("../models/Ticket");

class TicketDAO {
  create(data) {
    return Ticket.create(data).then(ticket => ticket.toObject());
  }

  findByPurchaser(email) {
    return Ticket.find({ purchaser: email }).sort({ purchase_datetime: -1 }).lean();
  }
}

module.exports = TicketDAO;
