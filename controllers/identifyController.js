const Contact = require('../models/contact');
const { Op } = require('sequelize');

const identify = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Email or phoneNumber required' });
    }

    // Find contacts that share email or phoneNumber
    let contacts = await Contact.findAll({
      where: {
        [Op.or]: [
          email ? { email } : null,
          phoneNumber ? { phoneNumber } : null,
        ].filter(Boolean),
      },
      order: [['createdAt', 'ASC']],
    });

    if (contacts.length === 0) {
      // No existing contact, create new primary contact
      const newContact = await Contact.create({
        email,
        phoneNumber,
        linkPrecedence: 'primary',
      });

      return res.json({
        contact: {
          primaryContatctId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: [],
        },
      });
    }

    // Extract all unique emails and phoneNumbers from found contacts
    const emailsSet = new Set();
    const phonesSet = new Set();
    contacts.forEach(c => {
      if (c.email) emailsSet.add(c.email);
      if (c.phoneNumber) phonesSet.add(c.phoneNumber);
    });

    // Find primary contact (oldest contact without linkedId)
    let primaryContact = contacts.find(c => c.linkPrecedence === 'primary');

    // If no primary found (should not happen), pick oldest
    if (!primaryContact) {
      primaryContact = contacts[0];
    }

    // Check if incoming info matches primary or secondary contact, else create secondary

    // If incoming email or phoneNumber not in the sets, create secondary linked to primary
    const isNewEmail = email && !emailsSet.has(email);
    const isNewPhone = phoneNumber && !phonesSet.has(phoneNumber);

    if (isNewEmail || isNewPhone) {
      const newSecondary = await Contact.create({
        email: isNewEmail ? email : null,
        phoneNumber: isNewPhone ? phoneNumber : null,
        linkPrecedence: 'secondary',
        linkedId: primaryContact.id,
      });

      contacts.push(newSecondary);

      if (isNewEmail) emailsSet.add(email);
      if (isNewPhone) phonesSet.add(phoneNumber);
    }

    // If multiple primary contacts found (rare case), merge them
    // (Optional advanced step - can be added later)

    // Prepare response
    const secondaryContacts = contacts.filter(c => c.id !== primaryContact.id);

    return res.json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails: Array.from(emailsSet),
        phoneNumbers: Array.from(phonesSet),
        secondaryContactIds: secondaryContacts.map(c => c.id),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { identify };
