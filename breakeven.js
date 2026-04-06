function fmt(n, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n);
}

function fmtCurrency(n) {
  return 'Rs' + fmt(n);
}

function calculate() {
  const errorEl = document.getElementById('error-msg');
  errorEl.textContent = '';

  const fixedCosts   = parseFloat(document.getElementById('fixed-costs').value)   || 0;
  const variableCost = parseFloat(document.getElementById('variable-cost').value) || 0;
  const sellingPrice = parseFloat(document.getElementById('selling-price').value) || 0;
  const targetProfit = parseFloat(document.getElementById('target-profit').value) || 0;

  if (fixedCosts <= 0 || variableCost <= 0 || sellingPrice <= 0) {
    errorEl.textContent = 'Please enter valid values for all required fields.';
    return;
  }

  if (sellingPrice <= variableCost) {
    errorEl.textContent = 'Selling price must be greater than variable cost per unit.';
    return;
  }

  const contributionMargin = sellingPrice - variableCost;
  const marginRatio        = (contributionMargin / sellingPrice) * 100;
  const bepUnits           = Math.ceil(fixedCosts / contributionMargin);
  const bepRevenue         = bepUnits * sellingPrice;

  // Update hero
  document.getElementById('bep-units').textContent    = fmt(bepUnits, 0);
  document.getElementById('bep-revenue').textContent  = fmtCurrency(bepRevenue) + ' total revenue needed';
  document.getElementById('bep-rev-val').textContent  = fmtCurrency(bepRevenue);
  document.getElementById('contrib-margin').textContent = fmtCurrency(contributionMargin);
  document.getElementById('margin-ratio').textContent = fmt(marginRatio, 1) + '%';

  // Target profit
  const targetCard = document.getElementById('target-card');
  if (targetProfit > 0) {
    const targetUnits = Math.ceil((fixedCosts + targetProfit) / contributionMargin);
    document.getElementById('target-units').textContent = fmt(targetUnits, 0) + ' units';
    targetCard.style.display = 'block';
  } else {
    targetCard.style.display = 'none';
  }

  // Animate
  const panel = document.getElementById('results-panel');
  panel.classList.remove('fresh');
  void panel.offsetWidth;
  panel.classList.add('fresh');

  drawChart(fixedCosts, variableCost, sellingPrice, bepUnits, targetProfit);
}

function drawChart(fixedCosts, variableCost, sellingPrice, bepUnits, targetProfit) {
  const canvas = document.getElementById('chart');
  const ctx    = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const maxUnits  = Math.ceil(bepUnits * 2.2);
  const maxRevenue = sellingPrice * maxUnits;
  const pad = { top: 20, right: 24, bottom: 44, left: 72 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  function xPos(units)   { return pad.left + (units / maxUnits) * chartW; }
  function yPos(dollars) { return pad.top + chartH - (dollars / maxRevenue) * chartH; }

  const steps = 60;
  const style = getComputedStyle(document.documentElement);
  const bg    = '#141618';
  const accentColor  = '#c8f060';
  const dangerColor  = '#f06080';
  const mutedColor   = 'rgba(255,255,255,0.12)';
  const textColor    = 'rgba(255,255,255,0.35)';
  const textColor2   = 'rgba(255,255,255,0.55)';

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = mutedColor;
  ctx.lineWidth = 0.5;
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = (maxRevenue / yTicks) * i;
    const y = yPos(val);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = '10px DM Mono, monospace';
    ctx.textAlign = 'right';
    const label = val >= 1000 ? 'Rs' + (val / 1000).toFixed(0) + 'k' : 'Rs' + val.toFixed(0);
    ctx.fillText(label, pad.left - 8, y + 4);
  }

  // X axis labels
  const xTicks = 5;
  ctx.textAlign = 'center';
  for (let i = 0; i <= xTicks; i++) {
    const val = Math.round((maxUnits / xTicks) * i);
    const x = xPos(val);
    ctx.fillStyle = textColor;
    ctx.font = '10px DM Mono, monospace';
    ctx.fillText(val, x, H - 10);

    ctx.strokeStyle = mutedColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + chartH);
    ctx.stroke();
  }

  // Fixed cost line (horizontal dashed)
  ctx.strokeStyle = 'rgba(90,88,86,0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(pad.left, yPos(fixedCosts));
  ctx.lineTo(W - pad.right, yPos(fixedCosts));
  ctx.stroke();
  ctx.setLineDash([]);

  // Total cost line
  ctx.strokeStyle = dangerColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = (maxUnits / steps) * i;
    const cost = fixedCosts + variableCost * u;
    const x = xPos(u);
    const y = yPos(cost);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Revenue line
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = (maxUnits / steps) * i;
    const rev = sellingPrice * u;
    const x = xPos(u);
    const y = yPos(rev);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Breakeven vertical line
  const bepX = xPos(bepUnits);
  ctx.strokeStyle = 'rgba(200,240,96,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(bepX, pad.top);
  ctx.lineTo(bepX, pad.top + chartH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Breakeven dot
  const bepY = yPos(bepUnits * sellingPrice);
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(bepX, bepY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = bg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bepX, bepY, 4, 0, Math.PI * 2);
  ctx.stroke();

  // BEP label
  ctx.fillStyle = accentColor;
  ctx.font = '500 11px DM Mono, monospace';
  ctx.textAlign = 'center';
  const labelX = bepX + (bepX > W * 0.7 ? -60 : 36);
  ctx.fillText('BEP', labelX, bepY - 6);
  ctx.fillText(fmt(bepUnits, 0) + ' units', labelX, bepY + 8);

  // Target profit dot if applicable
  if (targetProfit > 0) {
    const targetUnits = Math.ceil((fixedCosts + targetProfit) / (sellingPrice - variableCost));
    if (targetUnits <= maxUnits) {
      const tX = xPos(targetUnits);
      const tY = yPos(targetUnits * sellingPrice);
      ctx.fillStyle = '#5af0b8';
      ctx.beginPath();
      ctx.arc(tX, tY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5af0b8';
      ctx.font = '500 10px DM Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Target', tX, tY - 10);
    }
  }

  // Axis labels
  ctx.fillStyle = textColor2;
  ctx.font = '10px Syne, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Units Sold', pad.left + chartW / 2, H - 1);
}

// Draw empty chart on load
window.addEventListener('load', () => {
  const canvas = document.getElementById('chart');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#141618';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.font = '13px DM Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Enter values and click Calculate', canvas.width / 2, canvas.height / 2);
});

// Allow Enter key to trigger calculation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') calculate();
});
