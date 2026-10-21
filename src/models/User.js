// src/models/User.js - Mini Metaverse Kullanıcı Mongoose Veritabanı Modeli
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Kullanıcı adı zorunludur!'],
        unique: true,
        trim: true,
        minlength: [2, 'Kullanıcı adı en az 2 karakter olmalıdır!'],
        maxlength: [20, 'Kullanıcı adı en fazla 20 karakter olabilir!']
    },
    money: {
        type: Number,
        default: 1000
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male'
    },
    auth: {
        hash: { type: String, default: null },
        salt: { type: String, default: null }
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'mod', 'moderator'],
        default: 'user'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isMod: {
        type: Boolean,
        default: false
    },
    avatar: {
        model: { type: String, default: 'classic_2' },
        hat: { type: String, default: 'bere' },
        face: { type: String, default: 'none' },
        skinColor: { type: String, default: '#ffd1a4' },
        shirtColor: { type: String, default: '#3b82f6' },
        color: { type: String, default: '#3b82f6' },
        heldItem: { type: String, default: 'none' },
        shoes: { type: String, default: 'sneakers' },
        shirt: { type: String, default: null },
        outfit: { type: String, default: null }
    },
    inventory: {
        type: [String],
        default: ['hats_bere', 'skins_#facc15', 'shirts_#3b82f6', 'shoes_sneakers', 'face_none', 'props_none']
    },
    propInventory: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    furnitureInventory: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    friends: {
        type: [String],
        default: []
    },
    friendRequests: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    house: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    houses: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    skinSets: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    dailyQuests: {
        date: { type: String, default: '' },
        quests: [{
            id: { type: String },
            title: { type: String },
            desc: { type: String },
            target: { type: Number, default: 1 },
            reward: { type: Number, default: 0 },
            current: { type: Number, default: 0 },
            claimed: { type: Boolean, default: false }
        }]
    },
    teaExpiresAt: { type: Number, default: null },
    banExpiresAt: { type: Number, default: null },
    banReason: { type: String, default: null },
    bannedBy: { type: String, default: null },
    muteExpiresAt: { type: Number, default: null },
    muteReason: { type: String, default: null }
}, {
    timestamps: true,
    minimize: false // Boş nesnelerin ({}) MongoDB'ye kaydedilmesini garanti eder
});



// Kolay yardımcı statik metod: Kullanıcı adına göre arama
UserSchema.statics.findByUsername = function(uname) {
    if (!uname || typeof uname !== 'string') return Promise.resolve(null);
    const clean = uname.trim();
    return this.findOne({ username: { $regex: new RegExp(`^${clean}$`, 'i') } });
};

module.exports = mongoose.model('User', UserSchema);
