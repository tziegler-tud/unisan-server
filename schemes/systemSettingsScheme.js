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
            cookieSecrets: [{
                type: String
            }],
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
