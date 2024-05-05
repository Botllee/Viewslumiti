const autoViewStatus = (m, ridwanz) => {
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.sender = ridwanz.decodeJid((m.fromMe && ridwanz.user.id) || m.participant || m.key.participant || m.chat);

    if (!m.message) return;

    if (autoViewStatus && m.chat.endsWith('status@broadcast')) {
        ridwanz.readMessages([m.key]);
        return;
    }
};

module.exports = autoViewStatus;