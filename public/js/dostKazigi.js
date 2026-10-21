// public/js/dostKazigi.js - Dost Kazığı İstemci Mantığı ve Arayüz Kontrolörü
// 4 Kişilik Eşli & 3 Kişilik Tekli, Tek/Çift Deste Deste Desteği

let currentDostKazigiData = null;
let currentDkTimer = null;
let currentDkTimeLeft = 40;

// Socket Dinleyicisi
socket.on('dostKazigiUpdate', (data) => {
    if (!data) return;
    // Eğer oyuncu bu oyunda yer almıyorsa ve izleyici değilse işleme
    if (!data.isSpectator && data.players && !data.players.includes(socket.id)) {
        return;
    }
    currentDostKazigiData = data;
    window.currentActiveTableId = data.tableId;

    // Modalleri Aç/Kapat
    const gameModal = document.getElementById('gameModal');
    const dkArea = document.getElementById('dostKazigiArea');
    const batakArea = document.getElementById('batakArea');
    const billiardArea = document.getElementById('billiardArea');
    const tavlaArea = document.getElementById('tavlaArea');
    const okeyArea = document.getElementById('okey101Area');

    if (gameModal) {
        if (gameModal.style.display === 'none' || !gameModal.style.display) {
            gameModal.style.transform = 'translate(-50%, -50%)';
            gameModal.style.left = '50%';
            gameModal.style.top = '50%';
            gameModal.style.animation = '';
        }
        gameModal.style.display = 'block';
    }
    if (batakArea) batakArea.style.display = 'none';
    if (billiardArea) billiardArea.style.display = 'none';
    if (tavlaArea) tavlaArea.style.display = 'none';
    if (okeyArea) okeyArea.style.display = 'none';
    if (dkArea) dkArea.style.display = 'block';

    if (window.setVoiceTable && data.tableId) {
        window.setVoiceTable(data.tableId);
    }

    renderDostKazigiTable(data);
});

// Kart HTML Yardımcısı (Batak ile Birebir Aynı Tasarım)
function getDkCardHtml(card, extraClasses = '', inlineStyle = '') {
    if (!card) return '';
    const isRed = (card.suit === '♥' || card.suit === '♦');
    const colorClass = isRed ? 'red' : 'black';
    return `
        <div class="card ${colorClass} ${extraClasses}" style="${inlineStyle}">
            <div class="top-index"><span>${card.value}</span><span>${card.suit}</span></div>
            <div class="center-pip">${card.suit}</div>
            <div class="bot-index"><span>${card.value}</span><span>${card.suit}</span></div>
        </div>
    `;
}

// Masa ve Durum Çizimi
function renderDostKazigiTable(data) {
    const myPid = socket.id;
    const pCount = data.players.length;
    const is3P = !!data.is3P || pCount === 3;

    let myIndex = data.players.indexOf(myPid);
    if (myIndex === -1) myIndex = 0; // İzleyici için varsayılan koltuk

    // Koltuk İndeksleri Çözümlemesi:
    // Saat Yönünde Doğru Oturma Düzeni:
    // Sen: myIndex (Alt)
    // Sol Rakip: (myIndex + 1) % pCount (Sol Zone)
    // 4 Kişilikte: Eşin (myIndex + 2) % 4 (Üst Zone)
    // Sağ Rakip: 4P'de (myIndex + 3) % 4, 3P'de (myIndex + 2) % 3 (Sağ Zone)
    const bottomIdx = myIndex;
    const leftIdx = (myIndex + 1) % pCount;
    const rightIdx = is3P ? ((myIndex + 2) % 3) : ((myIndex + 3) % 4);
    const topIdx = is3P ? null : ((myIndex + 2) % 4);

    const bottomPid = data.players[bottomIdx];
    const leftPid = data.players[leftIdx];
    const rightPid = data.players[rightIdx];
    const topPid = topIdx !== null ? data.players[topIdx] : null;

    const bottomInfo = data.playerInfos[bottomPid] || {};
    const leftInfo = data.playerInfos[leftPid] || {};
    const rightInfo = data.playerInfos[rightPid] || {};
    const topInfo = topPid ? (data.playerInfos[topPid] || {}) : null;

    // 1. Üst Bilgi Çubuğu
    const handBadge = document.getElementById('dkHandBadge');
    if (handBadge) handBadge.innerText = `${data.currentHand} / ${data.totalHands} El`;

    const dealBadge = document.getElementById('dkDealBadge');
    if (dealBadge) dealBadge.innerText = `${data.currentDeal}. Dağıtım (${data.deckMode === 'cift_deste' ? 'Çift Deste' : 'Tek Deste'})`;

    const potBadge = document.getElementById('dkPotBadge');
    if (potBadge) potBadge.innerText = `💰 Pot: ${data.pot || 0} TL`;

    const statusText = document.getElementById('dkStatusText');
    if (statusText) {
        if (data.phase === 'hand_over') {
            statusText.innerText = `🔔 ${data.currentHand}. El Bitti!`;
        } else if (data.phase === 'game_over') {
            statusText.innerText = `🎉 Oyun Tamamlandı!`;
        } else if (data.myTurn) {
            statusText.innerText = `👉 SIRA SENDE!`;
        } else {
            statusText.innerText = `Sıra: ${data.turnPlayerName}`;
        }
    }

    // Sıra Sayacı (40 Saniye)
    startDkTurnCountdown(data);

    // 2. Takım / Skor Panosu
    renderScoreCards(data, is3P, bottomPid, leftPid, rightPid, topPid);

    // 3. Koltuk İsimleri ve Sıra Vurgulamaları
    renderSeatHeader('dkZoneLeft', 'dkLeftName', 'dkLeftHandBadge', leftInfo, data.turnIndex === leftIdx, "Sol Rakip");
    renderSeatHeader('dkZoneRight', 'dkRightName', 'dkRightHandBadge', rightInfo, data.turnIndex === rightIdx, "Sağ Rakip");

    const topZone = document.getElementById('dkZoneTop');
    if (topZone) {
        if (is3P) {
            topZone.style.display = 'none'; // 3 Kişilik masada eş koltuğu yok
        } else {
            topZone.style.display = 'block';
            renderSeatHeader('dkZoneTop', 'dkTopName', 'dkTopHandBadge', topInfo, data.turnIndex === topIdx, "Eşin");
        }
    }

    const myTurnBadge = document.getElementById('dkMyTurnBadge');
    if (myTurnBadge) myTurnBadge.style.display = data.myTurn ? 'inline-block' : 'none';

    // 4. Kasa (Ön Alan) Açık Kartlar Yığını
    // Kullanıcı İsteği: "Hangi rakibin üstünde güncel kaç ceza puanı olduğu yazmasın oyun sonunda hesaplansın"
    renderStack('dkBottomStack', bottomInfo.frontStack, bottomInfo.stackPenalty);
    renderStack('dkLeftStack', leftInfo.frontStack, leftInfo.stackPenalty);
    renderStack('dkRightStack', rightInfo.frontStack, rightInfo.stackPenalty);
    if (!is3P && topInfo) {
        renderStack('dkTopStack', topInfo.frontStack, topInfo.stackPenalty);
    }

    // 5. Masadaki 4 Açık Başlangıç Kartı
    renderCenterCards(data.centerCards);

    // 6. Masa Ortasındaki 5. Kart / Yığın (Center Pile)
    renderCenterPile(data.centerPile);

    // 7. Sayaçlar ve Duyuru Çubuğu
    const centerCountEl = document.getElementById('dkCenterCount');
    if (centerCountEl) {
        const openCount = (data.centerCards || []).filter(c => !!c).length;
        const pileCount = (data.centerPile || []).length;
        centerCountEl.innerText = `${openCount} Açık + ${pileCount} Yığın`;
    }

    const stockCountEl = document.getElementById('dkStockCount');
    if (stockCountEl) stockCountEl.innerText = `${data.stockCount || 0} Kart`;

    const actionBanner = document.getElementById('dkActionBanner');
    if (actionBanner && data.lastAction) {
        actionBanner.innerText = data.lastAction.description || 'Hamle yapıldı.';
    }

    // 8. Oyuncunun Elindeki Kartlar
    renderDostKazigiPlayerHand(data);

    // 9. El Sonu / Oyun Sonu Modalleri
    checkModalsState(data);
}

function renderScoreCards(data, is3P, bottomPid, leftPid, rightPid, topPid) {
    const teamACard = document.getElementById('dkTeamACard');
    const teamBCard = document.getElementById('dkTeamBCard');
    const teamAScore = document.getElementById('dkTeamAScore');
    const teamBScore = document.getElementById('dkTeamBScore');
    const teamAPlayers = document.getElementById('dkTeamAPlayers');
    const teamBPlayers = document.getElementById('dkTeamBPlayers');

    if (is3P) {
        if (teamACard && teamBCard) {
            teamACard.style.gridColumn = "span 2";
            teamBCard.style.display = "none";
        }
        if (teamAPlayers) {
            const p0Name = data.playerInfos[data.players[0]]?.name || "Oyuncu 1";
            const p1Name = data.playerInfos[data.players[1]]?.name || "Oyuncu 2";
            const p2Name = data.playerInfos[data.players[2]]?.name || "Oyuncu 3";
            teamAPlayers.innerText = `${p0Name} | ${p1Name} | ${p2Name}`;
        }
        if (teamAScore) {
            teamAScore.innerText = "3 Kişilik Bireysel Masa";
        }
    } else {
        if (teamACard && teamBCard) {
            teamACard.style.gridColumn = "auto";
            teamBCard.style.display = "flex";
        }
        const cumA = data.cumulativeTeamPenalties?.teamA || 0;
        const cumB = data.cumulativeTeamPenalties?.teamB || 0;

        if (teamAScore) teamAScore.innerText = `${cumA} Ceza`;
        if (teamBScore) teamBScore.innerText = `${cumB} Ceza`;

        const p0Name = data.playerInfos[data.players[0]]?.name || "Oyuncu 1";
        const p2Name = data.playerInfos[data.players[2]]?.name || "Oyuncu 3";
        const p1Name = data.playerInfos[data.players[1]]?.name || "Oyuncu 2";
        const p3Name = data.playerInfos[data.players[3]]?.name || "Oyuncu 4";

        if (teamAPlayers) teamAPlayers.innerText = `${p0Name} & ${p2Name}`;
        if (teamBPlayers) teamBPlayers.innerText = `${p1Name} & ${p3Name}`;
    }
}

function renderSeatHeader(zoneId, nameId, badgeId, pInfo, isTurn, defaultTitle) {
    const zone = document.getElementById(zoneId);
    const nameEl = document.getElementById(nameId);
    const badgeEl = document.getElementById(badgeId);

    if (zone) {
        if (isTurn) zone.classList.add('active-turn');
        else zone.classList.remove('active-turn');
    }
    if (nameEl) nameEl.innerText = pInfo?.name || defaultTitle;
    if (badgeEl) badgeEl.innerText = `${pInfo?.handCount || 0} Kart`;
}

function renderStack(containerId, stack, penalty) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (stack && stack.length > 0) {
        const topCard = stack[stack.length - 1];
        // Sadece el bittiğinde ceza puanı gösterilir, oyun oynanırken puan gizlenir
        const penaltyBadge = (penalty !== null && penalty !== undefined)
            ? `<span class="stack-penalty-badge">${penalty} Puan</span>`
            : '';

        container.innerHTML = `
            ${getDkCardHtml(topCard)}
            <span class="stack-counter">${stack.length} Kart</span>
            ${penaltyBadge}
        `;
    } else {
        container.innerHTML = `<span style="font-size:10px; color:#64748b; border:1px dashed #475569; padding:8px 6px; border-radius:6px;">Boş Kasa</span>`;
    }
}

// 4 Açık Başlangıç Kartını Ekrana Basma
function renderCenterCards(centerCards) {
    const list = document.getElementById('dkCenterCardsList');
    if (!list) return;

    list.innerHTML = '';
    const cards = centerCards || [];

    if (cards.length === 0) {
        list.innerHTML = `<span style="font-size:11px; color:#94a3b8; font-style:italic;">Kartlar alındı</span>`;
        return;
    }

    cards.forEach((c) => {
        if (c) {
            const cardWrap = document.createElement('div');
            cardWrap.innerHTML = getDkCardHtml(c, 'dk-open-center-card');
            list.appendChild(cardWrap);
        } else {
            const emptySlot = document.createElement('div');
            emptySlot.style.cssText = "width:36px; height:50px; border:1px dashed rgba(255,255,255,0.2); border-radius:4px;";
            list.appendChild(emptySlot);
        }
    });
}

// 5. Kart / Yığın (Center Pile) Çizimi
function renderCenterPile(centerPile) {
    const container = document.getElementById('dkCenterPileContainer');
    if (!container) return;

    if (centerPile && centerPile.length > 0) {
        const topCard = centerPile[centerPile.length - 1];
        container.innerHTML = `
            ${getDkCardHtml(topCard, 'center-pile-card')}
            <span class="stack-counter" style="position:absolute; bottom:-6px; right:-6px; background:#f59e0b; color:#000; font-weight:900; font-size:11px; padding:2px 7px; border-radius:999px; box-shadow:0 2px 6px rgba(0,0,0,0.6);">
                ${centerPile.length}
            </span>
        `;
    } else {
        container.innerHTML = `<span style="font-size:10px; color:#94a3b8; border:1px dashed #64748b; padding:16px 8px; border-radius:6px; line-height:1.2;">5. Kart<br>Yok</span>`;
    }
}

// Oyuncunun Elindeki Kartlar
function renderDostKazigiPlayerHand(data) {
    const handContainer = document.getElementById('dkPlayerHandCards');
    if (!handContainer) return;

    handContainer.innerHTML = '';
    const hand = data.hand || [];

    const isMyTurn = data.myTurn;
    const legal = data.myLegalMoves;

    hand.forEach((card, index) => {
        let isPlayable = isMyTurn;
        let isMandatoryMatch = false;

        if (isMyTurn && legal) {
            const cardInfo = legal.cardMoves ? legal.cardMoves[index] : null;
            if (legal.hasAnyMatch) {
                if (cardInfo && cardInfo.hasMatch) {
                    isMandatoryMatch = true;
                    isPlayable = true;
                } else {
                    isPlayable = false;
                }
            } else {
                isPlayable = true;
            }
        }

        const cardWrapper = document.createElement('div');
        cardWrapper.style.cursor = isPlayable ? 'pointer' : 'default';

        let extraClass = '';
        if (isPlayable && isMyTurn) {
            extraClass = isMandatoryMatch ? 'playable-match' : '';
        } else if (isMyTurn && !isPlayable) {
            extraClass = 'unplayable-dim';
        }

        cardWrapper.innerHTML = getDkCardHtml(card, extraClass);

        if (isPlayable && isMyTurn) {
            cardWrapper.onclick = () => onDkCardClicked(index);
        } else if (isMyTurn && !isPlayable) {
            cardWrapper.title = "Masada eşleşen kart varken eşleşmeyen kart atamazsınız!";
            cardWrapper.onclick = () => {
                if (typeof showFloatingToast === 'function') {
                    showFloatingToast("⚠️ Masada eşleşen kartınız varken bu kartı atamazsınız! Eşleşeni oynamalısınız.");
                }
            };
        }

        handContainer.appendChild(cardWrapper);
    });
}

// Kart Seçildiğinde Hamle / Hedef Seçim Penceresi
function onDkCardClicked(cardIndex) {
    if (!currentDostKazigiData || !currentDostKazigiData.myTurn) return;

    const data = currentDostKazigiData;
    const legal = data.myLegalMoves;
    if (!legal || !legal.cardMoves || !legal.cardMoves[cardIndex]) return;

    const cardInfo = legal.cardMoves[cardIndex];
    const playedCard = cardInfo.card;

    const pCount = data.players.length;
    const is3P = !!data.is3P || pCount === 3;
    const myIdx = data.players.indexOf(socket.id);

    const leftIdx = (myIdx + 1) % pCount;
    const rightIdx = is3P ? ((myIdx + 2) % 3) : ((myIdx + 3) % 4);
    const partnerIdx = is3P ? null : ((myIdx + 2) % 4);

    const leftName = data.playerInfos[data.players[leftIdx]]?.name || "Sol Rakip";
    const rightName = data.playerInfos[data.players[rightIdx]]?.name || "Sağ Rakip";
    const partnerName = partnerIdx !== null ? (data.playerInfos[data.players[partnerIdx]]?.name || "Eşin") : null;

    const modal = document.getElementById('dkActionModal');
    const preview = document.getElementById('dkActionCardPreview');
    const question = document.getElementById('dkActionQuestion');
    const btnList = document.getElementById('dkActionButtonsList');

    if (!modal || !preview || !btnList) return;

    preview.innerHTML = getDkCardHtml(playedCard);
    btnList.innerHTML = '';

    if (cardInfo.hasMatch) {
        question.innerText = `🎯 Bu kart (${playedCard.value}${playedCard.suit}) masadaki kartlarla eşleşti! Bu kazığı kime kitlemek istiyorsun?`;

        // Hedef Seçimi Butonları: Kullanıcı kime kazık atmak istediğini seçebilsin!
        cardInfo.matches.forEach((m) => {
            const matchHeader = document.createElement('div');
            matchHeader.style.cssText = "font-size:12px; font-weight:bold; color:#facc15; margin-top:6px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:3px;";
            matchHeader.innerText = m.label;
            btnList.appendChild(matchHeader);

            const targetRow = document.createElement('div');
            targetRow.style.cssText = "display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;";

            // Sol Rakibe Kilitle Butonu
            const btnLeft = createActionBtn(`👈 Sol Rakibe Kilitle (${leftName})`, 'btn-lock', () => {
                executeDkMove(cardIndex, m.actionType, leftIdx, m.centerCardIndex !== undefined ? m.centerCardIndex : m.sourceSeat);
            });
            targetRow.appendChild(btnLeft);

            // Sağ Rakibe Kilitle Butonu
            const btnRight = createActionBtn(`👉 Sağ Rakibe Kilitle (${rightName})`, 'btn-lock', () => {
                executeDkMove(cardIndex, m.actionType, rightIdx, m.centerCardIndex !== undefined ? m.centerCardIndex : m.sourceSeat);
            });
            targetRow.appendChild(btnRight);

            // 4 Kişilikte Eşe Kilitle Butonu (Opsiyonel)
            if (!is3P && partnerIdx !== null) {
                const btnPartner = createActionBtn(`⬆️ Eşine Kilitle (${partnerName})`, 'btn-support', () => {
                    executeDkMove(cardIndex, m.actionType, partnerIdx, m.centerCardIndex !== undefined ? m.centerCardIndex : m.sourceSeat);
                });
                targetRow.appendChild(btnPartner);
            }

            btnList.appendChild(targetRow);
        });
    } else {
        // Masada hiçbir kartla eşleşme yok:
        const hasCenterPile = data.centerPile && data.centerPile.length > 0;
        const discardText = hasCenterPile 
            ? `🎴 Ortadaki 5. Kartın Üzerine Bırak (Yığına Ekle)` 
            : `🎴 Masanın Ortasına 5. KART Olarak Bırak`;

        question.innerText = `Masada eşleşen kart yok. Kartı (${playedCard.value}${playedCard.suit}) ortaya bırak:`;

        const btnDiscard = createActionBtn(discardText, 'btn-neutral', () => {
            executeDkMove(cardIndex, 'discard_center');
        });
        btnList.appendChild(btnDiscard);
    }

    modal.style.display = 'flex';
}

function createActionBtn(text, extraClass, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `dk-action-btn ${extraClass}`;
    btn.innerText = text;
    btn.onclick = () => {
        closeDostKazigiActionModal();
        onClick();
    };
    return btn;
}

function closeDostKazigiActionModal() {
    const modal = document.getElementById('dkActionModal');
    if (modal) modal.style.display = 'none';
}

function executeDkMove(cardIndex, actionType, targetSeat = null, extraParam = null) {
    socket.emit('dostKazigiPlayCard', {
        cardIndex: cardIndex,
        actionType: actionType,
        targetSeat: targetSeat,
        extraParam: extraParam
    });
}

function startDkTurnCountdown(data) {
    const timerEl = document.getElementById('dkTurnTimer');
    if (!timerEl) return;

    if (currentDkTimer) {
        clearInterval(currentDkTimer);
        currentDkTimer = null;
    }

    if (data.phase !== 'play') {
        timerEl.style.display = 'none';
        return;
    }

    timerEl.style.display = 'inline-block';
    currentDkTimeLeft = data.turnTimeout || 40;
    timerEl.innerText = `⏱️ ${currentDkTimeLeft}s`;

    currentDkTimer = setInterval(() => {
        currentDkTimeLeft--;
        if (currentDkTimeLeft < 0) currentDkTimeLeft = 0;
        timerEl.innerText = `⏱️ ${currentDkTimeLeft}s`;
        if (currentDkTimeLeft <= 0) {
            clearInterval(currentDkTimer);
            currentDkTimer = null;
        }
    }, 1000);
}

// El Sonu ve Oyun Sonu Değerlendirme Modalleri
function checkModalsState(data) {
    const handModal = document.getElementById('dkHandOverModal');
    const titleEl = document.getElementById('dkHandOverTitle');
    const contentEl = document.getElementById('dkHandOverContent');
    const btnsEl = document.getElementById('dkHandOverButtons');

    if (!handModal || !titleEl || !contentEl || !btnsEl) return;

    if (data.phase === 'hand_over') {
        const lastHist = data.handHistory ? data.handHistory[data.handHistory.length - 1] : null;
        titleEl.innerText = `🔔 ${data.currentHand}. El Tamamlandı!`;

        let detailsHtml = '<div style="background:rgba(0,0,0,0.35); padding:10px; border-radius:8px; margin-bottom:10px;">';
        detailsHtml += '<div style="font-weight:900; color:#facc15; margin-bottom:6px; font-size:13px;">📋 OYUNCU CEZA DÖKÜMÜ</div>';

        if (lastHist && lastHist.playerDetails) {
            for (const pid in lastHist.playerDetails) {
                const det = lastHist.playerDetails[pid];
                const pName = data.playerInfos[pid]?.name || "Oyuncu";
                let bonusStr = "";
                if (det.bonus > 0) {
                    bonusStr = ` <span style="color:#ef4444; font-weight:bold;">(+${det.bonus} ${det.bonusReason || 'Ceza'})</span>`;
                } else if (det.bonus < 0) {
                    bonusStr = ` <span style="color:#22c55e; font-weight:bold;">(${det.bonus} ${det.bonusReason || 'Silindi'})</span>`;
                }

                detailsHtml += `
                    <div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between; border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:2px;">
                        <span>${pName} (${det.cardCount} Kart):</span>
                        <span><b>${det.basePenalty}</b> Puan${bonusStr} = <b style="color:#f59e0b;">${det.totalPenalty}</b> Ceza</span>
                    </div>
                `;
            }
        }

        if (!data.is3P && lastHist && lastHist.teamPenalties) {
            detailsHtml += `
                <div style="border-top:1.5px solid rgba(255,255,255,0.2); margin-top:8px; padding-top:6px; font-size:12.5px;">
                    <div style="color:#60a5fa; font-weight:bold;">Takım A (Sen & Eşin): ${lastHist.teamPenalties.teamA} Ceza (Toplam: ${data.cumulativeTeamPenalties.teamA})</div>
                    <div style="color:#f87171; font-weight:bold;">Takım B (Rakipler): ${lastHist.teamPenalties.teamB} Ceza (Toplam: ${data.cumulativeTeamPenalties.teamB})</div>
                </div>
            `;
        }

        detailsHtml += '</div>';

        const winnerLine = lastHist?.winnerTeam ? `<div style="color:#facc15; font-weight:bold; font-size:14px;">🏆 Bu Eli Kazanan: ${lastHist.winnerTeam}!</div>` : '';
        contentEl.innerHTML = `
            ${detailsHtml}
            ${winnerLine}
            <div style="font-size:11px; color:#94a3b8; margin-top:8px;">Bir sonraki el 5 saniye içinde başlayacaktır veya hemen butona basabilirsiniz.</div>
        `;

        btnsEl.innerHTML = `<button type="button" onclick="dkRequestNextHand()" style="padding:10px 24px; background:linear-gradient(135deg,#059669,#10b981); color:white; border:none; border-radius:8px; font-size:14px; font-weight:900; cursor:pointer;">Sonraki El (${data.currentHand + 1} / ${data.totalHands}) ➔</button>`;
        handModal.style.display = 'flex';
    }
    else if (data.phase === 'game_over') {
        titleEl.innerText = `🏆 OYUN TAMAMLANDI!`;
        let winText = "";

        if (!data.is3P) {
            const totalA = data.cumulativeTeamPenalties.teamA;
            const totalB = data.cumulativeTeamPenalties.teamB;
            if (totalA < totalB) {
                winText = "🎉 TEBRİKLER! TAKIM A KAZANDI!";
            } else if (totalB < totalA) {
                winText = "🏆 TAKIM B KAZANDI!";
            } else {
                winText = "🤝 BERABERE BİTTİ!";
            }
        } else {
            const winName = data.playerInfos[data.finalWinner]?.name || "Kazanan";
            winText = `🎉 TEBRİKLER! ${winName.toUpperCase()} EN AZ CEZAYLA KAZANDI!`;
        }

        let gameSummaryHtml = `
            <div style="font-size:18px; font-weight:900; color:#facc15; margin-bottom:10px;">${winText}</div>
        `;

        if (!data.is3P) {
            gameSummaryHtml += `
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; margin-bottom:12px;">
                    <div style="color:#60a5fa; font-weight:bold;">Takım A Toplam Ceza: ${data.cumulativeTeamPenalties.teamA}</div>
                    <div style="color:#f87171; font-weight:bold;">Takım B Toplam Ceza: ${data.cumulativeTeamPenalties.teamB}</div>
                </div>
            `;
        } else {
            gameSummaryHtml += `<div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; margin-bottom:12px;">`;
            data.players.forEach(pid => {
                const pName = data.playerInfos[pid]?.name || "Oyuncu";
                const pScore = data.cumulativePlayerPenalties ? data.cumulativePlayerPenalties[pid] : 0;
                gameSummaryHtml += `<div style="font-size:13px; font-weight:bold; margin-bottom:4px;">${pName}: ${pScore} Ceza</div>`;
            });
            gameSummaryHtml += `</div>`;
        }

        gameSummaryHtml += `<div style="font-size:12px; color:#94a3b8;">Yeniden oynamak için oy verin:</div>`;
        contentEl.innerHTML = gameSummaryHtml;

        const myVote = data.rematchVotes ? data.rematchVotes[socket.id] : null;
        if (myVote) {
            btnsEl.innerHTML = `<span style="font-size:13px; color:#facc15; font-weight:bold;">Oyunuz kaydedildi (${myVote === 'yes' ? 'Evet' : 'Hayır'}). Diğer oyuncular bekleniyor...</span>`;
        } else {
            btnsEl.innerHTML = `
                <button type="button" onclick="dkVoteRematch('yes')" style="padding:10px 20px; background:linear-gradient(135deg,#059669,#10b981); color:white; border:none; border-radius:8px; font-size:14px; font-weight:900; cursor:pointer;">🔄 Yeniden Oyna</button>
                <button type="button" onclick="leaveCurrentTable()" style="padding:10px 20px; background:linear-gradient(135deg,#dc2626,#b91c1c); color:white; border:none; border-radius:8px; font-size:14px; font-weight:900; cursor:pointer;">✕ Masadan Ayrıl</button>
            `;
        }
        handModal.style.display = 'flex';
    } else {
        handModal.style.display = 'none';
    }
}

function dkRequestNextHand() {
    socket.emit('dostKazigiNextHand');
}

function dkVoteRematch(vote) {
    socket.emit('dostKazigiVoteRematch', vote);
}
