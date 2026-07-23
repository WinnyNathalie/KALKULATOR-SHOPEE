const ORDER_PROCESS_FEE = 1250;
const PPH_PERCENT = 0.5;
const VAT_DIVISOR = 1.11;
const VAT_PERCENT = 11;

const elements = {
  form: document.getElementById("calculatorForm"),
  sellingPrice: document.getElementById("sellingPrice"),
  capitalCost: document.getElementById("capitalCost"),
  adminPercent: document.getElementById("adminPercent"),
  orderProcessFee: document.getElementById("orderProcessFee"),

  freeShippingToggle: document.getElementById("freeShippingToggle"),
  freeShippingField: document.getElementById("freeShippingField"),
  freeShippingPercent: document.getElementById("freeShippingPercent"),

  promoXtraToggle: document.getElementById("promoXtraToggle"),
  promoXtraField: document.getElementById("promoXtraField"),
  promoXtraPercent: document.getElementById("promoXtraPercent"),

  promoXtraPlusToggle: document.getElementById("promoXtraPlusToggle"),
  promoXtraPlusField: document.getElementById("promoXtraPlusField"),
  promoXtraPlusPercent: document.getElementById("promoXtraPlusPercent"),

  vatToggle: document.getElementById("vatToggle"),
  pphToggle: document.getElementById("pphToggle"),

  profitStatus: document.getElementById("profitStatus"),
  netProfit: document.getElementById("netProfit"),
  profitMargin: document.getElementById("profitMargin"),

  summarySellingPrice: document.getElementById("summarySellingPrice"),
  summaryCapitalCost: document.getElementById("summaryCapitalCost"),
  summaryAdminFee: document.getElementById("summaryAdminFee"),
  summaryOrderFee: document.getElementById("summaryOrderFee"),
  summaryFreeShipping: document.getElementById("summaryFreeShipping"),
  summaryPromoXtra: document.getElementById("summaryPromoXtra"),
  summaryPromoXtraPlus: document.getElementById("summaryPromoXtraPlus"),
  summaryVat: document.getElementById("summaryVat"),
  summaryPph: document.getElementById("summaryPph"),
  summaryTotalCost: document.getElementById("summaryTotalCost"),

  freeShippingResult: document.getElementById("freeShippingResult"),
  promoXtraResult: document.getElementById("promoXtraResult"),
  promoXtraPlusResult: document.getElementById("promoXtraPlusResult"),
  vatResult: document.getElementById("vatResult"),
  pphResult: document.getElementById("pphResult"),

  resetButton: document.getElementById("resetButton"),
  copyButton: document.getElementById("copyButton"),
  copyFeedback: document.getElementById("copyFeedback"),
};

function parseCurrency(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function parsePercent(value) {
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");

  const firstDot = normalized.indexOf(".");

  const cleaned =
    firstDot === -1
      ? normalized
      : normalized.slice(0, firstDot + 1) +
        normalized.slice(firstDot + 1).replace(/\./g, "");

  const result = Number.parseFloat(cleaned);

  return Number.isFinite(result) ? Math.max(0, result) : 0;
}

function formatInputCurrency(value) {
  const number = parseCurrency(value);

  return number
    ? new Intl.NumberFormat("id-ID").format(number)
    : "";
}

function formatCurrency(value, signed = false) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const absolute = Math.abs(safeValue);

  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(absolute);

  if (!signed) return formatted;

  if (safeValue > 0) return `+${formatted}`;
  if (safeValue < 0) return `-${formatted}`;

  return formatted;
}

function formatPercent(value) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function percentageFee(price, percentage, enabled = true) {
  return enabled ? price * (percentage / 100) : 0;
}

function calculate() {
  const sellingPrice = parseCurrency(
    elements.sellingPrice.value
  );

  const capitalCost = parseCurrency(
    elements.capitalCost.value
  );

  const adminPercent = parsePercent(
    elements.adminPercent.value
  );

  const freeShippingPercent = parsePercent(
    elements.freeShippingPercent.value
  );

  const promoXtraPercent = parsePercent(
    elements.promoXtraPercent.value
  );

  const promoXtraPlusPercent = parsePercent(
    elements.promoXtraPlusPercent.value
  );

  const adminFee = percentageFee(
    sellingPrice,
    adminPercent
  );

  // Biaya proses Rp1.250 hanya dihitung
  // jika harga jual sudah diisi.
  const orderProcessFee =
    sellingPrice > 0 ? ORDER_PROCESS_FEE : 0;

  const freeShippingFee = percentageFee(
    sellingPrice,
    freeShippingPercent,
    elements.freeShippingToggle.checked
  );

  const promoXtraFee = percentageFee(
    sellingPrice,
    promoXtraPercent,
    elements.promoXtraToggle.checked
  );

  const promoXtraPlusFee = percentageFee(
    sellingPrice,
    promoXtraPlusPercent,
    elements.promoXtraPlusToggle.checked
  );

  const vat = elements.vatToggle.checked
    ? (sellingPrice / VAT_DIVISOR) *
      (VAT_PERCENT / 100)
    : 0;

  const pph = elements.pphToggle.checked
    ? sellingPrice * (PPH_PERCENT / 100)
    : 0;

  const totalCost =
    capitalCost +
    adminFee +
    orderProcessFee +
    freeShippingFee +
    promoXtraFee +
    promoXtraPlusFee +
    vat +
    pph;

  const netProfit = sellingPrice - totalCost;

  const margin =
    sellingPrice > 0
      ? (netProfit / sellingPrice) * 100
      : 0;

  render({
    sellingPrice,
    capitalCost,
    adminFee,
    orderProcessFee,
    freeShippingFee,
    promoXtraFee,
    promoXtraPlusFee,
    vat,
    pph,
    totalCost,
    netProfit,
    margin,
  });
}

function render(data) {
  const {
    sellingPrice,
    capitalCost,
    adminFee,
    orderProcessFee,
    freeShippingFee,
    promoXtraFee,
    promoXtraPlusFee,
    vat,
    pph,
    totalCost,
    netProfit,
    margin,
  } = data;

  elements.summarySellingPrice.textContent =
    formatCurrency(sellingPrice);

  elements.summaryCapitalCost.textContent =
    formatCurrency(-capitalCost, true);

  elements.summaryAdminFee.textContent =
    formatCurrency(-adminFee, true);

  elements.summaryOrderFee.textContent =
    formatCurrency(-orderProcessFee, true);

  elements.summaryFreeShipping.textContent =
    formatCurrency(-freeShippingFee, true);

  elements.summaryPromoXtra.textContent =
    formatCurrency(-promoXtraFee, true);

  elements.summaryPromoXtraPlus.textContent =
    formatCurrency(-promoXtraPlusFee, true);

  elements.summaryVat.textContent =
    formatCurrency(-vat, true);

  elements.summaryPph.textContent =
    formatCurrency(-pph, true);

  elements.summaryTotalCost.textContent =
    formatCurrency(totalCost);

  elements.netProfit.textContent =
    formatCurrency(netProfit, true);

  elements.profitMargin.textContent =
    `Margin ${formatPercent(margin)}%`;

  elements.freeShippingResult.classList.toggle(
    "is-hidden",
    !elements.freeShippingToggle.checked
  );

  elements.promoXtraResult.classList.toggle(
    "is-hidden",
    !elements.promoXtraToggle.checked
  );

  elements.promoXtraPlusResult.classList.toggle(
    "is-hidden",
    !elements.promoXtraPlusToggle.checked
  );

  elements.vatResult.classList.toggle(
    "is-hidden",
    !elements.vatToggle.checked
  );

  elements.pphResult.classList.toggle(
    "is-hidden",
    !elements.pphToggle.checked
  );

  const state =
    netProfit > 0.005
      ? "profit"
      : netProfit < -0.005
      ? "loss"
      : "neutral";

  const labels = {
    profit: "UNTUNG",
    loss: "RUGI",
    neutral: "IMPAS",
  };

  elements.profitStatus.textContent =
    labels[state];

  elements.profitStatus.className =
    `profit-status ${state}`;

  elements.netProfit.className =
    `result-value ${
      state === "profit"
        ? "positive"
        : state === "loss"
        ? "negative"
        : "neutral"
    }`;

  elements.copyButton.dataset.summary =
    createSummaryText(data);
}

function createSummaryText(data) {
  const lines = [
    "RINGKASAN KALKULATOR SHOPEE",
    `Harga Jual: ${formatCurrency(
      data.sellingPrice
    )}`,
    `Modal: ${formatCurrency(
      data.capitalCost
    )}`,
    `Biaya Admin: ${formatCurrency(
      data.adminFee
    )}`,
    `Biaya Proses Pesanan: ${formatCurrency(
      data.orderProcessFee
    )}`,
  ];

  if (elements.freeShippingToggle.checked) {
    lines.push(
      `Gratis Ongkir: ${formatCurrency(
        data.freeShippingFee
      )}`
    );
  }

  if (elements.promoXtraToggle.checked) {
    lines.push(
      `Promo XTRA: ${formatCurrency(
        data.promoXtraFee
      )}`
    );
  }

  if (elements.promoXtraPlusToggle.checked) {
    lines.push(
      `Promo XTRA+: ${formatCurrency(
        data.promoXtraPlusFee
      )}`
    );
  }

  if (elements.vatToggle.checked) {
    lines.push(
      `PPN: ${formatCurrency(data.vat)}`
    );
  }

  if (elements.pphToggle.checked) {
    lines.push(
      `PPh 22: ${formatCurrency(data.pph)}`
    );
  }

  lines.push(
    `Total Potongan + Modal: ${formatCurrency(
      data.totalCost
    )}`,

    `Keuntungan Bersih: ${formatCurrency(
      data.netProfit,
      true
    )}`,

    `Margin: ${formatPercent(
      data.margin
    )}%`,

    `Status: ${
      data.netProfit > 0
        ? "UNTUNG"
        : data.netProfit < 0
        ? "RUGI"
        : "IMPAS"
    }`
  );

  return lines.join("\n");
}

function bindToggle(toggle, field) {
  toggle.addEventListener("change", () => {
    field.classList.toggle(
      "is-hidden",
      !toggle.checked
    );

    calculate();
  });
}

document
  .querySelectorAll(".currency-input")
  .forEach((input) => {
    input.addEventListener("input", () => {
      const cursorAtEnd =
        input.selectionStart ===
        input.value.length;

      input.value =
        formatInputCurrency(input.value);

      if (cursorAtEnd) {
        requestAnimationFrame(() => {
          input.setSelectionRange(
            input.value.length,
            input.value.length
          );
        });
      }

      calculate();
    });
  });

document
  .querySelectorAll(".percent-input")
  .forEach((input) => {
    input.addEventListener(
      "input",
      calculate
    );

    input.addEventListener("blur", () => {
      const value = parsePercent(
        input.value
      );

      input.value =
        formatPercent(value);

      calculate();
    });
  });

bindToggle(
  elements.freeShippingToggle,
  elements.freeShippingField
);

bindToggle(
  elements.promoXtraToggle,
  elements.promoXtraField
);

bindToggle(
  elements.promoXtraPlusToggle,
  elements.promoXtraPlusField
);

elements.vatToggle.addEventListener(
  "change",
  calculate
);

elements.pphToggle.addEventListener(
  "change",
  calculate
);

elements.resetButton.addEventListener(
  "click",
  () => {
    // Kosongkan harga jual dan modal.
    elements.sellingPrice.value = "";
    elements.capitalCost.value = "";

    // Biaya admin kembali ke 10%.
    elements.adminPercent.value = "10";

    // Matikan program Gratis Ongkir.
    elements.freeShippingToggle.checked =
      false;

    elements.freeShippingPercent.value =
      "9,5";

    elements.freeShippingField.classList.add(
      "is-hidden"
    );

    // Matikan Promo XTRA.
    elements.promoXtraToggle.checked =
      false;

    elements.promoXtraPercent.value =
      "0";

    elements.promoXtraField.classList.add(
      "is-hidden"
    );

    // Matikan Promo XTRA+.
    elements.promoXtraPlusToggle.checked =
      false;

    elements.promoXtraPlusPercent.value =
      "0";

    elements.promoXtraPlusField.classList.add(
      "is-hidden"
    );

    // PPN dan PPh 22 tetap aktif.
    elements.vatToggle.checked = true;
    elements.pphToggle.checked = true;

    elements.copyFeedback.textContent = "";

    calculate();
  }
);

elements.copyButton.addEventListener(
  "click",
  async () => {
    const summary =
      elements.copyButton.dataset.summary ||
      "";

    try {
      await navigator.clipboard.writeText(
        summary
      );

      elements.copyFeedback.textContent =
        "Ringkasan berhasil disalin.";
    } catch {
      const textarea =
        document.createElement("textarea");

      textarea.value = summary;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);

      textarea.select();

      document.execCommand("copy");

      textarea.remove();

      elements.copyFeedback.textContent =
        "Ringkasan berhasil disalin.";
    }

    window.setTimeout(() => {
      elements.copyFeedback.textContent =
        "";
    }, 2500);
  }
);

calculate();