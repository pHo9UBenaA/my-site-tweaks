"use strict";

/**
 * 目的:
 * - ページ内の <select> のうち、オプションに「あなたのみ」を含むものを強制的に「あなたのみ」に設定
 * - 上書きが実際に起きたときだけ alert を 1 回出す
 * - 上書き成功後は MutationObserver を停止
 */
(() => {
  const LABEL_PRIVATE = "あなたのみ";
  let notified = false; // alert 重複防止

  /** 「あなたのみ」オプションを持つ <select> を探す（aria-hidden 対象を優先） */
  const findPrivateSelectable = () => {
    const lists = [
      ...document.querySelectorAll('select[aria-hidden="true"]'),
      ...document.querySelectorAll("select")
    ];
    return lists.find(sel => {
      if (!(sel instanceof HTMLSelectElement)) return false;
      return Array.from(sel.options).some(o => (o.textContent || "").trim() === LABEL_PRIVATE);
    }) || null;
  };

  /**
   * 「あなたのみ」に設定し、input/change を発火
   * @returns {{changed:boolean, from:string|null, to:string|null}}
   */
  const setToPrivate = (sel) => {
    const targetOpt = Array.from(sel.options).find(o => (o.textContent || "").trim() === LABEL_PRIVATE);
    if (!targetOpt) return { changed: false, from: null, to: null };

    const beforeValue = sel.value;
    const beforeText = sel.selectedOptions?.[0]?.textContent?.trim() ?? null;

    if (beforeValue === targetOpt.value) {
      return { changed: false, from: beforeText, to: LABEL_PRIVATE };
    }

    sel.value = targetOpt.value;
    sel.dispatchEvent(new Event("input", { bubbles: true }));
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    if (document.activeElement === sel) sel.blur();

    return { changed: beforeValue !== sel.value, from: beforeText, to: LABEL_PRIVATE };
  };

  /** 1 回試行（成功時は監視停止＆通知） */
  const tryApplyOnce = () => {
    const sel = findPrivateSelectable();
    if (!sel) return { changed: false, from: null, to: null };

    const result = setToPrivate(sel);

    if (result.changed && !notified) {
      notified = true;
      const from = result.from ? `「${result.from}」` : "（不明）";
      alert(`公開範囲を「${result.to}」に上書きしました。旧設定: ${from}`);
      mo.disconnect(); // ★ 成功したら監視停止
    }
    return result;
  };

  // 初期リトライ（最大 ~10 秒）
  let tries = 0;
  const maxTries = 50, intervalMs = 200;
  const timerId = setInterval(() => {
    const r = tryApplyOnce();
    if (r.changed || ++tries >= maxTries) clearInterval(timerId);
  }, intervalMs);

  // SPA の描画差し替えに追従（成功後は停止）
  const mo = new MutationObserver(() => { tryApplyOnce(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  // ページ離脱時に監視解除
  window.addEventListener("beforeunload", () => mo.disconnect());
})();
