/**
 * أدوات تسوية ومطابقة النصوص العربية ومعالجة الفروق الإملائية:
 * - همزات الوصل والقطع (أ، إ، آ، ٱ -> ا)
 * - التاء المربوطة والهاء (ة -> ه)
 * - الألف المقصورة والياء (ى -> ي)
 * - كراسي الهمزة (ؤ، ئ -> ء)
 * - التشكيل والحركات والتطويل (ـ)
 * - الأرقام العربية الهندية (٠-٩ -> 0-9)
 */

export const normalizeArabic = (text: string | null | undefined): string => {
  if (text === null || text === undefined) return '';
  return String(text)
    // 1. إزالة حركات التشكيل (الفتحة، الضمة، الكسرة، التنوين، الشدة، السكون)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // 2. إزالة التطويل (الكشيدة ـ)
    .replace(/\u0640/g, '')
    // 3. تسوية كافة أشكال الألف (أ، إ، آ، ٱ) إلى ألف مجردة (ا)
    .replace(/[أإآٱ]/g, 'ا')
    // 4. تسوية التاء المربوطة (ة) مع الهاء (ه)
    .replace(/ة/g, 'ه')
    // 5. تسوية الألف المقصورة (ى) مع الياء (ي)
    .replace(/ى/g, 'ي')
    // 6. تسوية كراسي الهمزة (ؤ، ئ) إلى (ء)
    .replace(/[ؤئ]/g, 'ء')
    // 7. تحويل الأرقام العربية الهندية إلى أرقام لاتينية
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    // 8. تحويل إلى أحرف صغيرة وتسوية المسافات
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * فحص ما إذا كان النص المستهدف يحتوي على نص البحث مع مراعاة كافة الفروق الإملائية
 */
export const arabicIncludes = (target: string | null | undefined, query: string | null | undefined): boolean => {
  if (!query) return true;
  if (!target) return false;
  const normTarget = normalizeArabic(target);
  const normQuery = normalizeArabic(query);
  if (!normQuery) return true;
  return normTarget.includes(normQuery);
};

/**
 * مطابقة تامة بين نصين مع مراعاة كافة الفروق الإملائية
 */
export const arabicEquals = (a: string | null | undefined, b: string | null | undefined): boolean => {
  return normalizeArabic(a) === normalizeArabic(b);
};
