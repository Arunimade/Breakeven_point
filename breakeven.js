// Number formatting
function fmt(n, decimals = 0) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(n);
}

// Currency formatting (₹ Indian format)
function fmtCurrency(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(n);
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

  // Update UI
  document.getElementById('bep-units').textContent    = fmt(bepUnits);
  document.getElementById('bep-revenue').textContent  = fmtCurrency(bepRevenue) + ' total revenue needed';
  document.getElementById('bep-rev-val').textContent  = fmtCurrency(bepRevenue);
  document.getElementById('contrib-margin').textContent = fmtCurrency(contributionMargin);
  document.getElementById('margin-ratio').textContent = fmt(marginRatio, 1) + '%';

  // Target profit
  const targetCard = document.getElementById('target-card');
  if (targetProfit > 0) {
    const targetUnits = Math.ceil((fixedCosts + targetProfit) / contributionMargin);
    document.getElementById('target-units').textContent = fmt(targetUnits) + ' units';
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

  const maxUnits   = Math.ceil(bepUnits * 2.2);
  const maxRevenue = sellingPrice * maxUnits;

  const pad = { top: 20, right: 24, bottom: 44, left: 72 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  function xPos(units)   { return pad.left + (units / maxUnits) * chartW; }
  function yPos(value)   { return pad.top + chartH - (value / maxRevenue) * chartH; }

  const steps = 60;

  const bg = '#F8FAFC';
  const accentColor = '#16A34A';  // revenue (green)
  const dangerColor = '#DC2626';  // cost (red)
  const gridColor   = 'rgba(0,0,0,0.08)';
  const textColor   = '#9CA3AF';
  const textColor2  = '#4B5563';

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Y-axis grid + ₹ labels
  ctx.strokeStyle = gridColor;
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
    ctx.fillText(fmtCurrency(val), pad.left - 8, y + 4);
  }

  // X-axis
  const xTicks = 5;
  ctx.textAlign = 'center';

  for (let i = 0; i <= xTicks; i++) {
    const val = Math.round((maxUnits / xTicks) * i);
    const x = xPos(val);

    ctx.fillStyle = textColor;
    ctx.fillText(val, x, H - 10);

    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + chartH);
    ctx.stroke();
  }

  // Fixed cost line
  ctx.strokeStyle = '#6B7280';
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
  ctx.beginPath();

  for (let i = 0; i <= steps; i++) {
    const u = (maxUnits / steps) * i;
    const rev = sellingPrice * u;
    const x = xPos(u);
    const y = yPos(rev);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Break-even point
  const bepX = xPos(bepUnits);
  const bepY = yPos(bepUnits * sellingPrice);

  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.arc(bepX, bepY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#2563EB';
  ctx.font = '11px DM Mono';
  ctx.textAlign = 'center';
  ctx.fillText('BEP', bepX, bepY - 10);
  ctx.fillText(fmt(bepUnits) + ' units', bepX, bepY + 12);

  // Axis label
  ctx.fillStyle = textColor2;
  ctx.font = '11px Syne';
  ctx.fillText('Units Sold', pad.left + chartW / 2, H - 2);
}

// Initial empty chart
window.addEventListener('load', () => {
  const canvas = document.getElementById('chart');
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '13px DM Mono';
  ctx.textAlign = 'center';
  ctx.fillText('Enter values and click Calculate', canvas.width / 2, canvas.height / 2);
});

// Enter key support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') calculate();
});
