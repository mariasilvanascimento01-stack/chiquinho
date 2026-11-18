const cart = new Map();
const cartTrigger = document.querySelector(".cart-trigger");
const cartPanel = document.querySelector(".cart-panel");
const cartBackdrop = document.querySelector(".cart-backdrop");
const cartClose = document.querySelector(".cart-close");
const cartItems = document.querySelector(".cart-items");
const cartEmpty = document.querySelector(".cart-empty");
const cartSummary = document.querySelector(".cart-summary");
const cartCount = document.querySelector(".cart-count");
const cartTotal = document.querySelector(".cart-total");
const cartSubtotal = document.querySelector(".cart-subtotal");
const cartTitle = document.querySelector("#cart-title");
const cartEyebrow = document.querySelector(".cart-eyebrow");
const orderSuccess = document.querySelector(".order-success");
const orderSuccessBack = document.querySelector(".order-success-back");
const cartDiscountRow = document.querySelector(".cart-discount-row");
const cartDiscount = document.querySelector(".cart-discount");
const cartCouponName = document.querySelector(".cart-coupon-name");
const couponForm = document.querySelector(".coupon-form");
const couponInput = document.querySelector("#coupon-code");
const couponFeedback = document.querySelector(".coupon-feedback");
const removeCouponButton = document.querySelector(".remove-cart-coupon");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".primary-navigation");
const toast = document.querySelector(".toast");
const rewardPointsDisplay = document.querySelector("#reward-points");
const pointsTrack = document.querySelector(".points-track");
const pointsProgress = document.querySelector(".points-progress");
const pointsNext = document.querySelector("#points-next");
const redeemPointsButton = document.querySelector("#redeem-points");
const usePointsCouponButton = document.querySelector("#use-points-coupon");
const pointsCouponStatus = document.querySelector(".points-coupon-status");
const scratchCards = Array.from(document.querySelectorAll(".scratch-card"));
const scratchFeedback = document.querySelector(".scratch-feedback");
const usePrizeCouponButton = document.querySelector(".use-prize-coupon");
const profileTrigger = document.querySelector(".profile-trigger");
const profileBackdrop = document.querySelector(".profile-backdrop");
const profilePanel = document.querySelector(".profile-panel");
const profileClose = document.querySelector(".profile-close");
const profileForm = document.querySelector(".profile-form");
const profileCurrent = document.querySelector(".profile-current");
const profileNameInput = document.querySelector("#profile-name-input");
const profileEmailInput = document.querySelector("#profile-email-input");
const profileTriggerLabel = document.querySelector(".profile-label");
const profileNameDisplay = document.querySelector(".profile-name");
const profileEmailDisplay = document.querySelector(".profile-email");
const profileInitial = document.querySelector(".profile-initial");
const profilePointsValue = document.querySelector(".profile-points-value");
let toastTimeout;
let lastFocusedElement;
let orderComplete = false;
let rewardPoints = readStoredCount("chiquinho.reward-points");
let pointCoupons = readStoredCount("chiquinho.point-coupons");
let demoProfile = readDemoProfile();

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});

const couponRules = {
    DOCE10: { type: "percentage", value: 10 },
    SORVETE5: { type: "fixed", valueCents: 500, minimumCents: 2500 },
    PONTOS5: { type: "points", valueCents: 500, minimumCents: 2500 }
};

const savedCoupon = localStorage.getItem("chiquinho.applied-coupon") || "";
let appliedCoupon = Object.prototype.hasOwnProperty.call(couponRules, savedCoupon) ? savedCoupon : "";
couponInput.value = appliedCoupon;

function readStoredCount(key) {
    const value = Number(localStorage.getItem(key));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function readDemoProfile() {
    const name = localStorage.getItem("chiquinho.demo-profile-name");
    const email = localStorage.getItem("chiquinho.demo-profile-email");
    return name && email ? { name, email } : null;
}

function renderProfile() {
    const hasProfile = Boolean(demoProfile);
    profileCurrent.hidden = !hasProfile;
    profileForm.hidden = hasProfile;
    profileTriggerLabel.textContent = hasProfile ? "Perfil" : "Entrar";
    profileTrigger.setAttribute("aria-label", hasProfile ? `Abrir perfil de ${demoProfile.name}` : "Entrar ou abrir meu perfil");

    if (!hasProfile) {
        profileNameInput.value = "";
        profileEmailInput.value = "";
        return;
    }

    profileNameDisplay.textContent = demoProfile.name;
    profileEmailDisplay.textContent = demoProfile.email;
    profileInitial.textContent = demoProfile.name.trim().charAt(0).toUpperCase() || "C";
    profilePointsValue.textContent = rewardPoints;
}

function getLocalDateKey() {
    const date = new Date();
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function getSubtotalCents() {
    return Array.from(cart.values()).reduce((sum, product) => sum + Math.round(product.price * 100) * product.quantity, 0);
}

function setCouponMessage(message, isError) {
    couponFeedback.textContent = message;
    couponFeedback.classList.toggle("is-error", isError);
}

function updateRewardProgress() {
    const progress = rewardPoints >= 100 ? 100 : rewardPoints;
    rewardPointsDisplay.textContent = rewardPoints;
    pointsProgress.style.width = `${progress}%`;
    pointsTrack.setAttribute("aria-valuenow", progress);
    pointsNext.textContent = rewardPoints >= 100
        ? "Você já pode trocar 100 pontos por R$ 5."
        : `Faltam ${100 - rewardPoints} pontos para seu próximo mimo.`;
    redeemPointsButton.hidden = rewardPoints < 100;
    usePointsCouponButton.hidden = pointCoupons < 1;
    profilePointsValue.textContent = rewardPoints;
}

function calculateCouponDiscount(code, subtotalCents) {
    if (!Object.prototype.hasOwnProperty.call(couponRules, code)) return 0;
    const rule = couponRules[code];
    if (rule.type === "percentage") return Math.round(subtotalCents * rule.value / 100);
    if (subtotalCents < rule.minimumCents) return 0;
    return Math.min(subtotalCents, rule.valueCents);
}

function removeAppliedCoupon(message) {
    if (appliedCoupon === "PONTOS5") {
        pointCoupons += 1;
        localStorage.setItem("chiquinho.point-coupons", pointCoupons);
        updateRewardProgress();
    }

    appliedCoupon = "";
    localStorage.removeItem("chiquinho.applied-coupon");
    couponInput.value = "";
    removeCouponButton.hidden = true;
    if (message) setCouponMessage(message, true);
    updateCart();
}

function applyCoupon(value) {
    const code = value.trim().toUpperCase();
    const rule = Object.prototype.hasOwnProperty.call(couponRules, code) ? couponRules[code] : null;
    const subtotalCents = getSubtotalCents();

    if (!rule) {
        setCouponMessage("Não encontramos esse cupom. Confira o código e tente novamente.", true);
        return false;
    }

    if (code === "PONTOS5" && pointCoupons < 1 && appliedCoupon !== "PONTOS5") {
        setCouponMessage("Troque 100 pontos no Clube doce para liberar esse cupom.", true);
        return false;
    }

    if (rule.minimumCents && subtotalCents < rule.minimumCents) {
        setCouponMessage(`Esse cupom vale em pedidos a partir de ${currency.format(rule.minimumCents / 100)}.`, true);
        return false;
    }

    if (appliedCoupon === "PONTOS5" && code !== "PONTOS5") {
        pointCoupons += 1;
        localStorage.setItem("chiquinho.point-coupons", pointCoupons);
    }

    if (code === "PONTOS5" && appliedCoupon !== "PONTOS5") {
        pointCoupons -= 1;
        localStorage.setItem("chiquinho.point-coupons", pointCoupons);
    }

    appliedCoupon = code;
    localStorage.setItem("chiquinho.applied-coupon", code);
    couponInput.value = code;
    removeCouponButton.hidden = false;
    setCouponMessage(`Cupom ${code} aplicado com sucesso!`, false);
    updateRewardProgress();
    updateCart();
    showToast(`Cupom ${code} aplicado`);
    return true;
}

function updateCart() {
    const products = Array.from(cart.values());
    const itemCount = products.reduce((total, product) => total + product.quantity, 0);
    const subtotalCents = getSubtotalCents();

    if (appliedCoupon && couponRules[appliedCoupon].minimumCents > subtotalCents) {
        removeAppliedCoupon(`Cupom removido: o pedido precisa ter pelo menos ${currency.format(couponRules[appliedCoupon].minimumCents / 100)}.`);
    }

    const discountCents = appliedCoupon ? calculateCouponDiscount(appliedCoupon, subtotalCents) : 0;
    const totalCents = Math.max(0, subtotalCents - discountCents);

    cartCount.textContent = itemCount;
    cartTrigger.setAttribute("aria-label", `Abrir carrinho, ${itemCount} ${itemCount === 1 ? "item" : "itens"}`);
    cartItems.hidden = orderComplete;
    cartEmpty.hidden = products.length > 0 || orderComplete;
    cartSummary.hidden = products.length === 0 || orderComplete;
    orderSuccess.hidden = !orderComplete;
    cartTitle.textContent = orderComplete ? "Pedido finalizado" : "Meu carrinho";
    cartEyebrow.textContent = orderComplete ? "Muito obrigada!" : "Seu pedido";
    cartSubtotal.textContent = currency.format(subtotalCents / 100);
    cartDiscountRow.hidden = discountCents === 0;
    cartDiscount.textContent = `− ${currency.format(discountCents / 100)}`;
    cartCouponName.textContent = appliedCoupon ? `(${appliedCoupon})` : "";
    cartTotal.textContent = currency.format(totalCents / 100);
    removeCouponButton.hidden = !appliedCoupon;
    cartItems.replaceChildren();

    products.forEach((product) => {
        const row = document.createElement("article");
        row.className = "cart-item";

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = "";
        image.loading = "lazy";

        const details = document.createElement("div");
        const name = document.createElement("span");
        name.className = "cart-item-name";
        name.textContent = product.name;

        const price = document.createElement("span");
        price.className = "cart-item-price";
        price.textContent = currency.format(product.price * product.quantity);

        const quantity = document.createElement("div");
        quantity.className = "quantity-controls";

        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.dataset.action = "decrease";
        decrease.dataset.id = product.id;
        decrease.setAttribute("aria-label", `Diminuir quantidade de ${product.name}`);
        decrease.textContent = "−";

        const quantityValue = document.createElement("span");
        quantityValue.textContent = product.quantity;
        quantityValue.setAttribute("aria-label", "Quantidade");

        const increase = document.createElement("button");
        increase.type = "button";
        increase.dataset.action = "increase";
        increase.dataset.id = product.id;
        increase.setAttribute("aria-label", `Aumentar quantidade de ${product.name}`);
        increase.textContent = "+";

        quantity.append(decrease, quantityValue, increase);
        details.append(name, price, quantity);

        const remove = document.createElement("button");
        remove.className = "remove-item";
        remove.type = "button";
        remove.dataset.action = "remove";
        remove.dataset.id = product.id;
        remove.setAttribute("aria-label", `Remover ${product.name} do carrinho`);
        remove.textContent = "×";

        row.append(image, details, remove);
        cartItems.append(row);
    });
}

function openCart() {
    lastFocusedElement = document.activeElement;
    cartPanel.classList.add("is-open");
    cartPanel.setAttribute("aria-hidden", "false");
    cartTrigger.setAttribute("aria-expanded", "true");
    cartBackdrop.hidden = false;
    document.body.classList.add("cart-open");
    cartClose.focus();
}

function closeCart() {
    cartPanel.classList.remove("is-open");
    cartPanel.setAttribute("aria-hidden", "true");
    cartTrigger.setAttribute("aria-expanded", "false");
    cartBackdrop.hidden = true;
    document.body.classList.remove("cart-open");
    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

function finalizeOrder() {
    if (cart.size === 0) return;

    orderComplete = true;
    cart.clear();
    appliedCoupon = "";
    localStorage.removeItem("chiquinho.applied-coupon");
    couponInput.value = "";
    removeCouponButton.hidden = true;
    updateCart();
    orderSuccessBack.focus();
}

function returnToStore() {
    orderComplete = false;
    updateCart();
    closeCart();
}

function openProfile() {
    lastFocusedElement = document.activeElement;
    renderProfile();
    profilePanel.classList.add("is-open");
    profilePanel.setAttribute("aria-hidden", "false");
    profileTrigger.setAttribute("aria-expanded", "true");
    profileBackdrop.hidden = false;
    document.body.classList.add("profile-open");
    (demoProfile ? document.querySelector(".profile-edit") : profileNameInput).focus();
}

function closeProfile() {
    profilePanel.classList.remove("is-open");
    profilePanel.setAttribute("aria-hidden", "true");
    profileTrigger.setAttribute("aria-expanded", "false");
    profileBackdrop.hidden = true;
    document.body.classList.remove("profile-open");
    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
        toast.classList.remove("is-visible");
    }, 2400);
}

const gameRewards = [
    { type: "points", value: 15 },
    { type: "points", value: 20 },
    { type: "points", value: 25 },
    { type: "points", value: 40 },
    { type: "coupon", value: "DOCE10" },
    { type: "coupon", value: "SORVETE5" }
];

function showScratchResult(reward, selectedIndex) {
    scratchCards.forEach((card, index) => {
        card.disabled = true;
        if (index === selectedIndex) {
            card.classList.add("is-scratched");
            card.querySelector(".scratch-prize").textContent = reward.type === "points" ? `+${reward.value}` : "✓";
        }
    });

    if (reward.type === "points") {
        scratchFeedback.textContent = `Você ganhou ${reward.value} pontos! Continue juntando para trocar por desconto.`;
        usePrizeCouponButton.hidden = true;
    } else {
        scratchFeedback.textContent = `Surpresa! Você ganhou o cupom ${reward.value}.`;
        usePrizeCouponButton.dataset.coupon = reward.value;
        usePrizeCouponButton.hidden = false;
    }
}

function parseStoredReward(value) {
    if (!value) return null;
    const [type, rewardValue] = value.split("|");

    if (type === "points") {
        const points = Number(rewardValue);
        return Number.isSafeInteger(points) && points > 0 ? { type, value: points } : null;
    }

    if (type === "coupon" && Object.prototype.hasOwnProperty.call(couponRules, rewardValue)) {
        return { type, value: rewardValue };
    }

    return null;
}

function playScratchCard(selectedIndex) {
    if (localStorage.getItem("chiquinho.game-date") === getLocalDateKey()) return;

    const reward = gameRewards[Math.floor(Math.random() * gameRewards.length)];
    localStorage.setItem("chiquinho.game-date", getLocalDateKey());
    localStorage.setItem("chiquinho.game-choice", selectedIndex);
    localStorage.setItem("chiquinho.game-reward", `${reward.type}|${reward.value}`);

    if (reward.type === "points") {
        rewardPoints += reward.value;
        localStorage.setItem("chiquinho.reward-points", rewardPoints);
        updateRewardProgress();
    }

    showScratchResult(reward, selectedIndex);
}

function initializeScratchGame() {
    const playedToday = localStorage.getItem("chiquinho.game-date") === getLocalDateKey();
    const storedChoice = Number(localStorage.getItem("chiquinho.game-choice"));
    const reward = parseStoredReward(localStorage.getItem("chiquinho.game-reward"));

    if (playedToday && reward && Number.isInteger(storedChoice) && storedChoice >= 0 && storedChoice < scratchCards.length) {
        showScratchResult(reward, storedChoice);
    } else if (playedToday) {
        scratchCards.forEach((card) => {
            card.disabled = true;
        });
        scratchFeedback.textContent = "Você já raspou hoje. Tente novamente amanhã.";
    }
}

function selectCoupon(code) {
    couponInput.value = code;
    if (cart.size > 0) {
        openCart();
        applyCoupon(code);
        return;
    }

    showToast(`Cupom ${code} separado. Adicione produtos para aplicar.`);
    document.querySelector("#menu").scrollIntoView({ behavior: "smooth" });
}

document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", () => {
        const { id, name, price, image } = button.dataset;
        const existingProduct = cart.get(id);
        orderComplete = false;

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.set(id, {
                id,
                name,
                price: Number(price),
                image,
                quantity: 1
            });
        }

        updateCart();
        if (!appliedCoupon && couponInput.value.trim()) {
            applyCoupon(couponInput.value);
        }
        showToast(`${name} adicionado ao carrinho`);
    });
});

cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const product = cart.get(button.dataset.id);
    if (!product) return;

    if (button.dataset.action === "increase") {
        product.quantity += 1;
    } else if (button.dataset.action === "decrease") {
        product.quantity -= 1;
        if (product.quantity <= 0) cart.delete(product.id);
    } else if (button.dataset.action === "remove") {
        cart.delete(product.id);
    }

    updateCart();
});

cartTrigger.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);
document.querySelector(".cart-continue").addEventListener("click", closeCart);
document.querySelector(".cart-finish").addEventListener("click", finalizeOrder);
orderSuccessBack.addEventListener("click", returnToStore);
profileTrigger.addEventListener("click", openProfile);
profileClose.addEventListener("click", closeProfile);
profileBackdrop.addEventListener("click", closeProfile);
profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = profileNameInput.value.trim();
    const email = profileEmailInput.value.trim();

    if (name.length < 2) {
        profileNameInput.setCustomValidity("Digite um nome com pelo menos duas letras.");
        profileNameInput.reportValidity();
        return;
    }

    profileNameInput.setCustomValidity("");
    demoProfile = { name, email };
    localStorage.setItem("chiquinho.demo-profile-name", name);
    localStorage.setItem("chiquinho.demo-profile-email", email);
    renderProfile();
    showToast("Perfil salvo neste navegador");
});
profileNameInput.addEventListener("input", () => {
    profileNameInput.setCustomValidity("");
});
document.querySelector(".profile-edit").addEventListener("click", () => {
    profileForm.hidden = false;
    profileCurrent.hidden = true;
    profileNameInput.value = demoProfile.name;
    profileEmailInput.value = demoProfile.email;
    profileNameInput.focus();
});
document.querySelector(".profile-logout").addEventListener("click", () => {
    localStorage.removeItem("chiquinho.demo-profile-name");
    localStorage.removeItem("chiquinho.demo-profile-email");
    demoProfile = null;
    renderProfile();
    showToast("Você saiu do perfil neste navegador");
});
couponForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyCoupon(couponInput.value);
});
removeCouponButton.addEventListener("click", () => {
    removeAppliedCoupon("Cupom removido do pedido.");
});
document.querySelectorAll(".coupon-use").forEach((button) => {
    button.addEventListener("click", () => {
        selectCoupon(button.dataset.coupon);
    });
});
usePrizeCouponButton.addEventListener("click", () => {
    selectCoupon(usePrizeCouponButton.dataset.coupon);
});
usePointsCouponButton.addEventListener("click", () => {
    selectCoupon("PONTOS5");
});
redeemPointsButton.addEventListener("click", () => {
    if (rewardPoints < 100) return;

    rewardPoints -= 100;
    pointCoupons += 1;
    localStorage.setItem("chiquinho.reward-points", rewardPoints);
    localStorage.setItem("chiquinho.point-coupons", pointCoupons);
    pointsCouponStatus.textContent = "Cupom PONTOS5 liberado. Use R$ 5 de desconto em pedidos acima de R$ 25.";
    updateRewardProgress();
});
scratchCards.forEach((card) => {
    card.addEventListener("click", () => {
        playScratchCard(Number(card.dataset.scratch));
    });
});

document.addEventListener("keydown", (event) => {
    const profileIsOpen = profilePanel.classList.contains("is-open");
    const cartIsOpen = cartPanel.classList.contains("is-open");

    if (event.key === "Escape" && profileIsOpen) {
        closeProfile();
    } else if (event.key === "Escape" && cartIsOpen) {
        closeCart();
    }

    if (event.key === "Tab" && (profileIsOpen || cartIsOpen)) {
        const activePanel = profileIsOpen ? profilePanel : cartPanel;
        const focusableElements = Array.from(activePanel.querySelectorAll("a[href], button:not([disabled]), input:not([disabled])"))
            .filter((element) => !element.closest("[hidden]"));
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }
});

menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    navigation.classList.toggle("is-open", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        navigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");
    });
});

document.querySelectorAll("[data-reveal]").forEach((element) => {
    element.classList.add("will-reveal");
});

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".will-reveal").forEach((element) => {
        revealObserver.observe(element);
    });
} else {
    document.querySelectorAll(".will-reveal").forEach((element) => {
        element.classList.add("is-visible");
    });
}

updateCart();
updateRewardProgress();
initializeScratchGame();
renderProfile();
