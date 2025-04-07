import mongoose from 'mongoose';
const Schema = mongoose.Schema;

// create instance of Schema
var SystemSettingsScheme = new Schema({
    identifier: {
        type: String,
        required: true,
    },
    system: {
        debugLevel: {
            type: Number,
            default: 0,
        }
    },
    auth: {
        openid: {
            enabled: {
                type: Boolean,
                default: true,
            },
            issuer: {
                type: String,
            },
            port: {

            },
        }
    },
    mail: {
        enabled: {
            type: Boolean,
            default: true,
        },
        createAccountOnUserCreation: {
            type: Boolean,
            default: true,
        },
        deleteAccountOnUserDeletion: {
            type: Boolean,
            default: true,
        },
        systemMailAccount: {
            type: String,
        },
        systemMailAccountToken: {
            type: String,
        },
        url: {
            type: String,
        },
        port: {
            type: Number,
        },
        baseUrl: {
            type: String,
        },
        imap_url: {
            type: String,
        },
        smtp_url: {
            type: String,
        },
        domain: {
            type: String,
        }
    },
    members: {
        memberId: {
            mode: {
                type: String,
                default: 'auto-free',
            },
            offset: {
                type: Number,
                auto: 0,
            }
        },

    }
});

SystemSettingsScheme.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('SystemSettings', SystemSettingsScheme);
