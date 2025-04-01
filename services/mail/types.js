/**
 * @typedef {Object} CreateUserConfig
 * @property {string} email
 * @property {string} raw_password
 * @property {string} [comment]
 * @property {int} [quota_bytes]
 * @property {boolean} [global_admin]
 * @property {boolean} [enabled]
 * @property {boolean} [change_pw_next_login]
 * @property {boolean} [enable_imap]
 * @property {boolean} [enable_pop]
 * @property {boolean} [allow_spoofing]
 * @property {boolean} [forward_enabled]
 * @property {array<string>} [forward_destination]
 * @property {boolean} [forward_keep]
 * @property {boolean} [reply_enabled]
 * @property {boolean} [reply_subject]
 * @property {string} [reply_body]
 * @property {string} [reply_startdate] YYYY-MM-DD
 * @property {string} [reply_enddate] YYYY-MM-DD
 * @property {string} displayed_name
 * @property {boolean} [spam_enabled]
 * @property {boolean} [spam_mark_as_read]
 * @property {int} [spam_threshold=80]
 */

/**
 * @typedef {Object} UpdateUserConfig
 * @property {string} [email]
 * @property {string} [raw_password]
 * @property {string} [comment]
 * @property {int} [quota_bytes]
 * @property {boolean} [global_admin]
 * @property {boolean} [enabled]
 * @property {boolean} [change_pw_next_login]
 * @property {boolean} [enable_imap]
 * @property {boolean} [enable_pop]
 * @property {boolean} [allow_spoofing]
 * @property {boolean} [forward_enabled]
 * @property {array<string>} [forward_destination]
 * @property {boolean} [forward_keep]
 * @property {boolean} [reply_enabled]
 * @property {boolean} [reply_subject]
 * @property {string} [reply_body]
 * @property {string} [reply_startdate] YYYY-MM-DD
 * @property {string} [reply_enddate] YYYY-MM-DD
 * @property {string} [displayed_name]
 * @property {boolean} [spam_enabled]
 * @property {boolean} [spam_mark_as_read]
 * @property {int} [spam_threshold=80]
 */

/**
 * @typedef MailUser User object as returned from mailu mail server
 * @property {string} email
 * @property {string} raw_password
 * @property {string} comment
 * @property {int} quota_bytes
 * @property {int} quota_bytes_used
 * @property {boolean} global_admin
 * @property {boolean} enabled
 * @property {boolean} change_pw_next_login
 * @property {boolean} enable_imap
 * @property {boolean} enable_pop
 * @property {boolean} allow_spoofing
 * @property {boolean} forward_enabled
 * @property {array<string>} forward_destination
 * @property {boolean} forward_keep
 * @property {boolean} reply_enabled
 * @property {boolean} reply_subject
 * @property {string} reply_body
 * @property {string} reply_startdate YYYY-MM-DD
 * @property {string} reply_enddate YYYY-MM-DD
 * @property {string} displayed_name
 * @property {boolean} spam_enabled
 * @property {boolean} spam_mark_as_read
 * @property {int} spam_threshold=80
 */