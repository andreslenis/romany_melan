# Plan: Discount Code Sync, UI Fixes, and Checkout Flow Improvements

## Overview
Implement 4 key modifications:
1. Sync discount code between cart and checkout
2. Clear discount code after successful purchase
3. Reduce header-to-content spacing
4. Change announcement bar text color to white

---

## 1. Discount Code Sync Between Cart and Checkout

### Current State
- Discount code state (`codigoDescuento`, `codigoInfo`) lives only in `CheckoutPage` (src/app/checkout/page.tsx)
- Cart context (`CartContext.tsx`) has no discount code state
- Cart drawer (`CartDrawer.tsx`) doesn't show discount code

### Changes Required

#### A. Add Discount Code to CartContext (src/context/CartContext.tsx)
- Add `codigoDescuento` state (string)
- Add `codigoInfo` state (CodigoDescuentoInfo | null)
- Add `setCodigoDescuento` function
- Add `setCodigoInfo` function
- Add `clearCodigoDescuento` function
- Persist discount code in localStorage (optional, but useful for refresh)

#### B. Update CartDrawer (src/components/cart/CartDrawer.tsx)
- Display discount code input and applied discount info
- Use `useCart` to access discount code state
- Show discount in subtotal calculation

#### C. Update CheckoutPage (src/app/checkout/page.tsx)
- Remove local `codigoDescuento` and `codigoInfo` state
- Use `useCart` for discount code state
- Update `validarCodigoDescuento` to use cart context setters
- Pass discount code from cart context to `WebCheckoutForm`

#### D. Update WebCheckoutForm (src/components/checkout/WebCheckoutForm.tsx)
- Receive `codigoDescuento` from props (already exists)
- No changes needed to logic

---

## 2. Clear Discount Code After Purchase

### Current State
- In `RespuestaContent` (src/app/checkout/respuesta/page.tsx), when payment is approved, `clear()` is called on cart
- Discount code is not cleared

### Changes Required
- In `RespuestaContent`, after `clear()` is called, also call `clearCodigoDescuento()` from cart context
- This ensures new purchases require re-applying a discount code

---

## 3. Reduce Header-to-Content Spacing

### Current State
- Header has `padding: 1.25rem 0;` (globals.css line 84)
- Announcement bar has `padding: 0.5rem 1rem;` / `0.625rem 1rem;` (lines 1147, 1154)
- Checkout page has `padding: clamp(2rem, 6vw, 4rem) 0 clamp(4rem, 10vw, 6rem);` (line 2895)
- Other pages have similar top padding

### Changes Required
- Reduce header padding from `1.25rem` to `0.75rem` or `1rem`
- Reduce announcement bar padding slightly
- Reduce checkout page top padding from `clamp(2rem, 6vw, 4rem)` to `clamp(1.5rem, 4vw, 3rem)`
- Check other pages for similar spacing issues

---

## 4. Change Announcement Bar Text Color to White

### Current State
- globals.css line 1141: `color: #D4AF37;` (gold)

### Changes Required
- Change to `color: #FFFFFF;` (white)
- Keep font-weight, letter-spacing, text-transform

---

## Implementation Order

1. **CartContext.tsx** - Add discount code state and functions
2. **CartDrawer.tsx** - Display discount code UI
3. **CheckoutPage** - Use cart context for discount code
4. **RespuestaContent** - Clear discount code on successful payment
5. **globals.css** - Update announcement bar color and spacing
6. **Test** - Verify all flows work correctly

---

## Testing Checklist

- [ ] Apply discount code in checkout → appears in cart drawer
- [ ] Apply discount code in cart drawer → appears in checkout
- [ ] Complete purchase → discount code cleared
- [ ] New purchase → requires new discount code
- [ ] Announcement bar text is white
- [ ] Header-to-content spacing reduced
- [ ] Cart subtotal shows discount correctly
- [ ] Checkout summary shows discount correctly