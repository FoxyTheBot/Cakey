import mongoose, { ConnectOptions } from 'mongoose';
import { logger } from '../utils/logger';
import { bot } from '../utils/discord/FoxyClient';
const { v4: uuidv4 } = require('uuid');
export default class DatabaseConnection {
    private client: any;
    private user: any;
    private commands: any;
    private guilds: any;
    private key: any;
    private legacykeys: any;
    private riotAccount: any;

    constructor(client) {
        mongoose.set("strictQuery", true)
        mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        } as ConnectOptions).catch((error) => {
            logger.error(`Failed to connect to database: `, error);
        });
        logger.info(`[DATABASE] Connected to database!`);
        const legacyKeySchema = new mongoose.Schema({
            key: String,
            user: String,
            used: Boolean,
            expiresAt: Date,
            pType: Number,
            guild: String,
        }, { versionKey: false, id: false
        });
        const keySchema = new mongoose.Schema({
            key: String,
            used: Boolean,
            expiresAt: Date,
            pType: Number,
            guild: String,
        }, { versionKey: false, id: false });
        const keySchemaForGuilds = new mongoose.Schema({
            key: String,
            used: Boolean,
            expiresAt: Date,
            pType: Number,
            guild: String,
            owner: String,
        }, { versionKey: false, id: false
        });
        const trasactionSchema = new mongoose.Schema({
            to: String,
            from: String,
            quantity: Number,
            date: Date,
            received: Boolean,
            type: String,
        }, { versionKey: false, id: false });
        const userSchema = new mongoose.Schema({
            _id: String,
            userCreationTimestamp: Date,
            premium: Boolean,
            premiumDate: Date,
            isBanned: Boolean,
            banData: Date,
            banReason: String,
            aboutme: String,
            balance: Number,
            lastDaily: Date,
            marriedWith: String,
            marriedDate: Date,
            cantMarry: Boolean,
            repCount: Number,
            lastRep: Date,
            background: String,
            backgrounds: Array,
            premiumType: String,
            language: String,
            mask: String,
            masks: Array,
            layout: String,
            transactions: [trasactionSchema],
            riotAccount: {
                isLinked: Boolean,
                puuid: String,
                isPrivate: Boolean,
                region: String,
                access_token: String,
            },
            premiumKeys: [keySchema]
        }, { versionKey: false, id: false });

        const commandsSchema = new mongoose.Schema({
            commandName: String,
            commandUsageCount: Number,
            description: String,
            isInactive: Boolean,
            subcommands: Array,
            usage: Array
        }, { versionKey: false, id: false });

        const guildSchema = new mongoose.Schema({
            _id: String,
            InviteBlockerModule: {
                isEnabled: Boolean,
                whitelistedInvites: Array,
                whitelistedChannels: Array,
                whitelistedRoles: Array,
                whitelistedUsers: Array,
                blockMessage: String,
            },
            AutoRoleModule: {
                isEnabled: Boolean,
                roles: Array,
            },
            GuildJoinLeaveModule: {
                isEnabled: Boolean,
                joinMessage: String,
                alertWhenUserLeaves: Boolean,
                leaveMessage: String,
                joinChannel: String,
                leaveChannel: String,
            },
            premiumKeys: [keySchemaForGuilds]
        }, { versionKey: false, id: false });

        const riotAccountSchema = new mongoose.Schema({
            puuid: String,
            authCode: String,
        });
        
        this.user = mongoose.model('user', userSchema);
        this.commands = mongoose.model('commands', commandsSchema);
        this.guilds = mongoose.model('guilds', guildSchema);
        this.key = mongoose.model('key', keySchema);
        this.legacykeys = mongoose.model('legacykeys', legacyKeySchema);
        this.riotAccount = mongoose.model('riotAccount', riotAccountSchema);
        this.client = client;
    }

    async getUser(userId: any): Promise<any> {
        const user = await bot.helpers.getUser(userId)

        if (!user) return null;

        let document = await this.user.findOne({ _id: userId });

        if (!document) {
            document = new this.user({
                _id: userId,
                userCreationTimestamp: Date.now(),
                premium: false,
                premiumDate: null,
                isBanned: false,
                banData: null,
                banReason: null,
                aboutme: null,
                balance: 0,
                lastDaily: null,
                marriedWith: null,
                marriedDate: null,
                cantMarry: false,
                repCount: 0,
                lastRep: null,
                background: "default",
                backgrounds: ["default"],
                premiumType: null,
                language: 'pt-BR',
                mask: null,
                masks: [],
                layout: "default",
                transactions: [],
                premiumKeys: [],
                riotAccount: {
                    isLinked: false,
                    puuid: null,
                    isPrivate: false,
                    region: null,
                    access_token: null,
                },
            }).save();
        }

        return document;
    }

    async getAllCommands(): Promise<void> {
        let commandsData = await this.commands.find({});
        return commandsData.map(command => command.toJSON());
    }

    async getAllUsageCount(): Promise<Number> {
        let commandsData = await this.commands.find({});
        let usageCount = 0;
        commandsData.map(command => usageCount += command.commandUsageCount);
        return usageCount;

    }

    async getGuild(guildId: BigInt) {
        let document = await this.guilds.findOne({ _id: guildId });

        if (!document) {
            document = new this.guilds({
                _id: guildId,
                InviteBlockerModule: {
                    isEnabled: false,
                    whitelistedInvites: [],
                    whitelistedChannels: [],
                    whitelistedRoles: [],
                    whitelistedUsers: [],
                    blockMessage: null,
                },
                AutoRoleModule: {
                    isEnabled: false,
                    roles: [],
                },
                GuildJoinLeaveModule: {
                    isEnabled: false,
                    joinMessage: null,
                    alertWhenUserLeaves: false,
                    leaveMessage: null,
                    joinChannel: null,
                    leaveChannel: null,
                }
            }).save();
        }

        return document;
    }

    async addGuild(guildId: BigInt) {
        let document = await this.guilds.findOne({ _id: guildId });

        if (!document) {
            document = new this.guilds({
                _id: guildId,
                InviteBlockerModule: {
                    isEnabled: false,
                    whitelistedInvites: [],
                    whitelistedChannels: [],
                    whitelistedRoles: [],
                    whitelistedUsers: [],
                    blockMessage: null,
                },
                AutoRoleModule: {
                    isEnabled: false,
                    roles: [],
                },
                GuildJoinLeaveModule: {
                    isEnabled: false,
                    joinMessage: null,
                    alertWhenUserLeaves: false,
                    leaveMessage: null,
                    joinChannel: null,
                    leaveChannel: null,
                }
            }).save();
            return null;
        }

        return document;
    }

    async removeGuild(guildId: BigInt) {
        let document = await this.guilds.findOne({ _id: guildId });

        if (document) {
            document.delete();
        } else {
            return null;
        }

        return document;
    }

    async updateUser(userId: any, data: any, removeFromArray?: boolean | false) {
        try {
            const jsonString = JSON.stringify(data);
            const parsedData = JSON.parse(jsonString);
            let updateObject = {};
            for (const key in parsedData) {
                if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
                    const value = parsedData[key];
                    if (Array.isArray(value)) {
                        if (removeFromArray) {
                            updateObject = { ...updateObject, $pull: { [key]: value } };
                        } else {
                            updateObject = { ...updateObject, $push: { [key]: value } };
                        }
                    } else {
                        updateObject = { ...updateObject, $set: { [key]: value } };
                    }
                }
            }
            const document = await this.user.findOneAndUpdate({ _id: userId }, updateObject, { new: true });
            return document;
        } catch (error) {
            return null;
        }
    }

    async updateGuild(guildId: any, data: any, removeFromArray?: boolean | false) {
        try {
            const jsonString = JSON.stringify(data);
            const parsedData = JSON.parse(jsonString);
            let updateObject = {};
            for (const key in parsedData) {
                if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
                    const value = parsedData[key];
                    if (Array.isArray(value)) {
                        if (removeFromArray) {
                            updateObject = { ...updateObject, $pull: { [key]: value } };
                        } else {
                            updateObject = { ...updateObject, $push: { [key]: value } };
                        }
                    } else {
                        updateObject = { ...updateObject, $set: { [key]: value } };
                    }
                }
            }
            const document = await this.guilds.findOneAndUpdate({ _id: guildId }, updateObject, { new: true });
            return document;
        } catch (error) {
            return null;
        }
    }

    async addAccount(puuid: string, authCode: string) {
        let document = await this.riotAccount.findOne({ puuid: puuid });

        if (document) {
            document.authCode = authCode;
            document.save();
        } else {
            document = new this.riotAccount({
                puuid: puuid,
                authCode: authCode,
            }).save();
        }
        return document;
    }
    
    async registerKey(user: String, expiresAt: Date, pType: Number) {
        const key = uuidv4();
        const userDocument = await this.getUser(user);

        userDocument.premiumKeys.push({
            key: key,
            used: false,
            expiresAt: expiresAt,
            pType: pType,
            guild: null,
        });
    }

    async getKey(key: string) {
        var document = await this.user.findOne({ premiumKeys: { $elemMatch: { key: key } } });

        if (!document) {
            return null;
        } else {
            return document;
        }
    }

    async getAllUsers(): Promise<void> {
        let usersData = await this.user.find({});
        return usersData.map(user => user.toJSON());
    }

    async getAllGuilds(): Promise<void> {
        let guildsData = await this.guilds.find({});
        return guildsData.map(guild => guild.toJSON());
    }

    async createKey(userId, pType: string): Promise<void> {
        const key = uuidv4();
        const userDocument = await this.getUser(userId);

        userDocument.premiumKeys.push({
            key: key,
            used: false,
            expiresAt: new Date(Date.now() + 2592000000),
            pType: pType,
            guild: null,
        });
        await userDocument.save();
        return key;
    }

    async deleteUser(userId: any) {
        try {
            await this.user.findOneAndDelete({ _id: userId });
        } catch (error) {
            console.log(error)
            return null;
        }
    }

    async deleteGuild(guildId: any) {
        try {
            await this.guilds.findOneAndDelete({ _id: guildId });
        } catch (error) {
            console.log(error)
            return null;
        }
    }
}