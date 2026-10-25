// ─── SAVE / EXPORT SPRINT RESULT IMAGE VIA HTML5 CANVAS ───
export const exportSprintResultImage = (challengeToDownload, room, toast) => {
  const ch = challengeToDownload || room?.activeChallenge;
  if (!ch) {
    if (toast) toast.error('No sprint result to export');
    return;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Sleek dark background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#111827');
    bgGrad.addColorStop(1, '#050811');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 700);

    // 2. Amber neon border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 1152, 652);

    // Corner accent marks
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(20, 20, 32, 4);
    ctx.fillRect(20, 20, 4, 32);
    ctx.fillRect(1148, 20, 32, 4);
    ctx.fillRect(1176, 20, 4, 32);
    ctx.fillRect(20, 676, 32, 4);
    ctx.fillRect(20, 648, 4, 32);
    ctx.fillRect(1148, 676, 32, 4);
    ctx.fillRect(1176, 648, 4, 32);

    // 3. Header badge
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('NEXTLEVEL ARENA  •  SPRINT RESULTS', 54, 75);

    // Date / Room Code
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const dateStr = ch.createdAt ? new Date(ch.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillText(`Room: ${room?.title || 'Study Room'} (${room?.inviteCode || 'NextLevel'})  •  ${dateStr}`, 700, 75);

    // 4. Sprint Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(ch.title || 'Multiplayer Challenge', 54, 135);

    // Mode Badge & Parameters
    const modeName = ch.gameMode === 'BOSS' ? 'Co-op Boss Battle' : ch.gameMode === 'SURVIVAL' ? 'Sudden-Death Survival' : ch.gameMode === 'TEAMS' ? 'Squad Battle' : 'OA Blitz (FFA)';
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const modeLabel = `MODE: ${modeName.toUpperCase()}`;
    ctx.fillText(modeLabel, 54, 175);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`•  ${ch.questionCount || 10} Questions  •  ${ch.perQuestionSeconds || 30}s / Question`, 54 + ctx.measureText(modeLabel).width + 16, 175);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(54, 205);
    ctx.lineTo(1146, 205);
    ctx.stroke();

    // 5. Standings / Leaderboard Cards
    const leaderboard = ch.leaderboard || [];
    if (leaderboard.length === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Sprint completed! No participant scores were recorded.', 54, 300);
    } else {
      const top3 = leaderboard.slice(0, 3);
      const cardWidth = 345;
      const startX = 54;
      const cardY = 240;
      const cardH = 340;

      top3.forEach((player, idx) => {
        const x = startX + idx * (cardWidth + 28);
        const isWinner = idx === 0;

        // Card Background
        ctx.fillStyle = isWinner ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(x, cardY, cardWidth, cardH);
        ctx.strokeStyle = isWinner ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isWinner ? 2 : 1;
        ctx.strokeRect(x, cardY, cardWidth, cardH);

        // Medal / Rank
        const medals = ['🥇 1ST PLACE', '🥈 2ND PLACE', '🥉 3RD PLACE'];
        ctx.fillStyle = isWinner ? '#f59e0b' : '#d1d5db';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(medals[idx], x + 24, cardY + 45);

        // Player Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const truncatedName = (player.userName || 'Participant').length > 18 ? (player.userName || 'Participant').slice(0, 16) + '...' : (player.userName || 'Participant');
        ctx.fillText(truncatedName, x + 24, cardY + 95);

        // Score
        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`${player.score || 0}`, x + 24, cardY + 165);
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('PTS', x + 24 + ctx.measureText(`${player.score || 0}`).width + 8, cardY + 165);

        // Divider inside card
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(x + 24, cardY + 200);
        ctx.lineTo(x + cardWidth - 24, cardY + 200);
        ctx.stroke();

        // Correct answers
        ctx.fillStyle = '#9ca3af';
        ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Accuracy:', x + 24, cardY + 245);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`${player.correctCount || 0} / ${ch.questionCount || 10} correct`, x + 120, cardY + 245);

        // Avg Speed
        ctx.fillStyle = '#9ca3af';
        ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Avg Speed:', x + 24, cardY + 290);
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`${player.avgSpeedSeconds || 0}s / question`, x + 120, cardY + 290);
      });
    }

    // 6. Footer Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Verified NextLevel Co-Working Session  •  app.nextlevel.ai', 54, 635);

    // Trigger instant PNG download
    const safeTitle = (ch.title || 'sprint').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const link = document.createElement('a');
    link.download = `nextlevel-sprint-${safeTitle}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (toast) toast.success('Sprint result image downloaded!');
  } catch (err) {
    if (toast) toast.error('Failed to generate result image');
  }
};
