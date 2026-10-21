// public/js/kiraathaneBar.js - Dostlar Kıraathanesi Çay & İçecek Standı Modülü
// Çaycı Hüseyin Usta NPC'si ve Geleneksel İçecek Satın Alma Sistemi

const KIRAATHANE_DRINK_ITEMS = [
    {
        id: 'cay',
        name: 'Taze Tavşan Kanı İnce Belli Çay',
        price: 5,
        icon: '☕',
        badge: 'En Çok Satan',
        badgeColor: '#ef4444',
        desc: 'Bakır semaverde taze demlenmiş, dumanı üstünde kıraathane çayı. (5 dk buhar efekti & içme animasyonu)'
    },
    {
        id: 'kahve',
        name: 'Közde Bol Köpüklü Türk Kahvesi',
        price: 15,
        icon: '☕',
        badge: 'Geleneksel',
        badgeColor: '#b45309',
        desc: 'Bakır cezvede köz ateşinde pişirilmiş, fincan tabağında özel kahve.'
    },
    {
        id: 'gazoz',
        name: 'Nostaljik Cam Şişe Gazoz',
        price: 12,
        icon: '🧊',
        badge: 'Buz Gibi',
        badgeColor: '#0ea5e9',
        desc: 'Klasik nostaljik açacaklı cam şişe gazoz. Ferahlatıcı serinlik!'
    },
    {
        id: 'limonata',
        name: 'Buzlu Taze Limonata',
        price: 15,
        icon: '🍋',
        badge: 'Ferahlatıcı',
        badgeColor: '#eab308',
        desc: 'Taze limon ve nane yapraklarıyla hazırlanan buz gibi ev yapımı limonata.'
    },
    {
        id: 'oralet',
        name: 'Sıcak Kuşburnu & Oralet',
        price: 10,
        icon: '🍵',
        badge: 'Kıraathane Klasiği',
        badgeColor: '#f97316',
        desc: 'Buram buram kokan kupa bardakta sıcacık kıraathane oraleti.'
    },
    {
        id: 'coconut',
        name: 'Tropik Hindistan Cevizi Kokteyli',
        price: 25,
        icon: '🥥',
        badge: 'Egzotik',
        badgeColor: '#10b981',
        desc: 'Taze hindistan cevizi suyu ve pipetli serinletici içecek.'
    }
];

function ensureKiraathaneBarModal() {
    if (document.getElementById('kiraathaneBarModal')) return;

    const modal = document.createElement('div');
    modal.id = 'kiraathaneBarModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(10, 8, 6, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 46000;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
    `;

    modal.innerHTML = `
        <div style="background: linear-gradient(145deg, #1c130d, #2a1a10); border: 2px solid #f59e0b; border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 25px 60px rgba(0,0,0,0.9), 0 0 25px rgba(245, 158, 11, 0.2); overflow: hidden; display: flex; flex-direction: column;">
            <!-- Başlık ve Çaycı Hüseyin Usta Bilgisi -->
            <div style="padding: 16px 20px; background: linear-gradient(90deg, #78350f, #92400e, #451a03); border-bottom: 2px solid #ca8a04; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; background: #451a03; border: 2px solid #facc15; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
                        👨🏻‍🦳
                    </div>
                    <div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <h2 style="margin: 0; font-size: 18px; font-weight: 900; color: #fef08a; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">Çaycı Hüseyin Usta</h2>
                            <span style="background: #facc15; color: #000; font-size: 10px; font-weight: 900; padding: 1px 6px; border-radius: 4px;">KIRATHANE OCAĞI</span>
                        </div>
                        <p style="margin: 3px 0 0 0; font-size: 11.5px; color: #fde68a;">"Buyur hemşerim! Semaver kaynıyor, kahve közde, ne içersin?"</p>
                    </div>
                </div>
                <button type="button" onclick="closeKiraathaneBarModal()" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.2); color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseenter="this.style.background='rgba(239,68,68,0.6)'" onmouseleave="this.style.background='rgba(0,0,0,0.35)'">✕</button>
            </div>

            <!-- İçecek Listesi -->
            <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px; max-height: 60vh; overflow-y: auto;">
                ${KIRAATHANE_DRINK_ITEMS.map(item => `
                    <div style="background: rgba(28, 19, 13, 0.75); border: 1.5px solid rgba(217, 119, 6, 0.35); border-radius: 14px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: all 0.2s;" onmouseenter="this.style.borderColor='#facc15'; this.style.background='rgba(69, 26, 3, 0.7)'" onmouseleave="this.style.borderColor='rgba(217, 119, 6, 0.35)'; this.style.background='rgba(28, 19, 13, 0.75)'">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="font-size: 26px; background: rgba(0,0,0,0.4); width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(250,204,21,0.25);">${item.icon}</div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-weight: 800; font-size: 14px; color: #ffffff;">${item.name}</span>
                                    ${item.badge ? `<span style="font-size: 9.5px; font-weight: 800; background: ${item.badgeColor}; color: white; padding: 1px 5px; border-radius: 4px;">${item.badge}</span>` : ''}
                                </div>
                                <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">${item.desc}</div>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; min-width: 85px;">
                            <span style="font-weight: 900; font-size: 15px; color: #facc15;">${item.price} TL</span>
                            <button onclick="orderKiraathaneDrink('${item.id}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: #0f172a; font-weight: 900; font-size: 12px; padding: 6px 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35); transition: transform 0.15s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">Sipariş Ver</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Alt Bilgi Çubuğu -->
            <div style="padding: 12px 20px; background: rgba(15, 10, 6, 0.8); border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11.5px; color: #94a3b8;">☕ İçeceğiniz hazırlanıp elinize verilir ve afiyetle içersiniz.</span>
                <button onclick="closeKiraathaneBarModal()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 16px; border-radius: 8px; font-weight: 600; font-size: 12px; cursor: pointer;">Kapat</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeKiraathaneBarModal();
    });
}

function openKiraathaneBarModal() {
    ensureKiraathaneBarModal();
    const modal = document.getElementById('kiraathaneBarModal');
    if (modal) {
        modal.style.display = 'flex';
        if (window.playSound) window.playSound('click');
    }
}
window.openKiraathaneBarModal = openKiraathaneBarModal;

function closeKiraathaneBarModal() {
    const modal = document.getElementById('kiraathaneBarModal');
    if (modal) modal.style.display = 'none';
}
window.closeKiraathaneBarModal = closeKiraathaneBarModal;

function orderKiraathaneDrink(drinkId) {
    let sock = window.socket || (typeof io !== 'undefined' ? io() : null);
    if (sock) {
        sock.emit('buyKiraathaneDrink', { id: drinkId });
    }
}
window.orderKiraathaneDrink = orderKiraathaneDrink;

function attachKiraathaneSocketListener() {
    let sock = window.socket || (typeof socket !== 'undefined' ? socket : null);
    if (sock && !sock._kiraathaneListenerAttached) {
        sock._kiraathaneListenerAttached = true;
        sock.on('kiraathaneDrinkSuccess', (item) => {
            if (window.playSound) {
                window.playSound('coin');
                window.playSound('tea_sip');
            }
            if (typeof showSocialNotificationToast === 'function') {
                showSocialNotificationToast(item.icon, 'Afiyet Olsun!', `${item.name} satın aldınız! (-${item.price} TL)`);
            } else if (typeof showFloatingToast === 'function') {
                showFloatingToast(`${item.icon} ${item.name} satın alındı! (-${item.price} TL)`);
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.attachKiraathaneSocketListener = attachKiraathaneSocketListener;
    if (window.socket || typeof socket !== 'undefined') {
        attachKiraathaneSocketListener();
    } else {
        window.addEventListener('load', attachKiraathaneSocketListener);
    }
}
