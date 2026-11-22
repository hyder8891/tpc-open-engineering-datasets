/**
 * @pc-cn/mpn-normalizer
 * Zero-dependency OEM Manufacturer Part Number (MPN) normalization, OCR confusion
 * repair (O<->0, I/l<->1), and brand-family classification engine maintained by
 * The Power Contractor (https://pc-cn.com · info@pc-cn.com · +86 153 1498 7933).
 */

export const SUPPORTED_BRANDS = Object.freeze([
  'ABB',
  'Siemens',
  'Allen-Bradley',
  'Schneider Electric',
  'Yokogawa',
  'Rosemount',
  'Bently Nevada',
  'Hagglunds',
  'EagleBurgmann',
]);

const BRAND_PREFIX_STRIP_RE = new RegExp(
  '^(?:new\\s+|genuine\\s+|original\\s+|oem\\s+)*' +
    '(?:abb|siemens|allen[-\\s]?bradley|rockwell(?:\\s+automation)?|ab|' +
    'schneider(?:\\s+electric)?|telemecanique|modicon|yokogawa|' +
    'rosemount|emerson|bently\\s+nevada|bentley\\s+nevada|bently|' +
    'h[aä]gglunds|bosch\\s+rexroth|eagle\\s*burgmann|burgmann)\\s*[:\\-]?\\s*',
  'i'
);

const PACKAGING_SUFFIX_RE =
  /(?:\s+|\/|-)(?:SER(?:IES)?[\s.-]*([A-Z0-9]{1,3})|REV[\s.-]*([A-Z0-9]{1,4})|PACK|PKG|BULK|NEW|OEM)\s*$/i;

function digitsFix(str) {
  return str.replace(/[OoQD]/g, '0').replace(/[Iil|]/g, '1');
}

function lettersFix(str) {
  return str.replace(/0/g, 'O').replace(/1/g, 'I');
}

function applyMask(str, mask) {
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    const m = mask[i] || '*';
    if (m === 'D') {
      out += digitsFix(ch);
    } else if (m === 'L') {
      out += lettersFix(ch);
    } else {
      out += ch;
    }
  }
  return out;
}

function detectBrandHint(rawInput, explicitBrand = '') {
  const combined = `${explicitBrand} ${rawInput}`.toLowerCase();
  if (/\b(?:eagle\s*burgmann|burgmann|burgman)\b/.test(combined)) return 'EagleBurgmann';
  if (/\b(?:h[aä]gglunds|hagglund)\b/.test(combined)) return 'Hagglunds';
  if (/\b(?:bently|bentley)\b/.test(combined)) return 'Bently Nevada';
  if (/\b(?:rosemount)\b/.test(combined)) return 'Rosemount';
  if (/\b(?:yokogawa|centum|dpharp)\b/.test(combined)) return 'Yokogawa';
  if (/\b(?:schneider|modicon|tesys|altivar|telemecanique)\b/.test(combined)) return 'Schneider Electric';
  if (/\b(?:allen[-\s]?bradley|rockwell|controllogix|compactlogix|powerflex)\b/.test(combined)) return 'Allen-Bradley';
  if (/\b(?:siemens|simatic|sinamics|sitop|sirius|sentron)\b/.test(combined)) return 'Siemens';
  if (/\b(?:abb|advant|emax|tmax)\b/.test(combined)) return 'ABB';
  return null;
}

/**
 * Repair common OCR / corroded-nameplate character confusions (O<->0, I/l<->1)
 * using deterministic OEM positional masks across all 9 supported industrial families.
 *
 * @param {string} cleanedUpper Uppercase cleaned token
 * @param {string|null} brandHint Optional brand hint
 * @returns {{ token: string, repairs: string[], matchedFamily: string|null, brand: string|null }}
 */
export function repairOcrConfusions(cleanedUpper, brandHint = null) {
  const repairs = [];
  let s = String(cleanedUpper || '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .trim();

  const recordIfChanged = (before, after, reason) => {
    const beforeAlnum = before.replace(/[^A-Z0-9]/g, '');
    const afterAlnum = after.replace(/[^A-Z0-9]/g, '');
    if (beforeAlnum !== afterAlnum) {
      repairs.push(`${reason}: ${before} -> ${after}`);
    }
    return after;
  };

  // Compact form without spaces for pattern testing
  const noSpace = s.replace(/\s+/g, '');
  const alnum = noSpace.replace(/[^A-Z0-9]/g, '');

  // 1. ABB Advant / AC 800M / Symphony / Excitation / Robotics: 3Bxx / 3HAC + 6-8 digits + R + digits
  const abbModuleRe = /^([3][BH][A-Z]{2})([0-9OQDIL|]{6,8})(R)([0-9OQDIL|]{1,4})$/;
  const mAbbMod = alnum.match(abbModuleRe);
  if (mAbbMod) {
    const fixed = `${lettersFix(mAbbMod[1])}${digitsFix(mAbbMod[2])}R${digitsFix(mAbbMod[4])}`;
    return {
      token: recordIfChanged(s, fixed, 'ABB_3B_MODULE_OCR'),
      repairs,
      matchedFamily: 'ABB DCS / Power Electronics Module',
      brand: 'ABB',
    };
  }

  // 1b. ABB LV/MV Switchgear & Controls: 1SDA / 1SFA / 1SVR / 1SAP / 2CCA
  const abbLvRe = /^([12I][S][DFAVRP][A-Z0])([0-9OQDIL|]{6,8})(R)([0-9OQDIL|]{1,4})$/;
  const mAbbLv = alnum.match(abbLvRe);
  if (mAbbLv) {
    const prefix = `${digitsFix(mAbbLv[1][0])}${lettersFix(mAbbLv[1].slice(1))}`;
    const fixed = `${prefix}${digitsFix(mAbbLv[2])}R${digitsFix(mAbbLv[4])}`;
    return {
      token: recordIfChanged(s, fixed, 'ABB_1S_SWITCHGEAR_OCR'),
      repairs,
      matchedFamily: 'ABB Switchgear / Control Component',
      brand: 'ABB',
    };
  }

  // 1c. ABB ACS/ACH/ACQ Drives: ACS880-01-045A-3
  const abbDriveRe = /^(AC[SHQM])([0-9OQDIL|]{3})[-\s]?([0-9OQDIL|]{2})[-\s]?([0-9OQDIL|]{3,4}[A-Z0-9])[-\s]?([0-9OQDIL|]{1,2})(?:[-\s]?([A-Z0-9+]+))?$/;
  const mAbbDrive = s.match(abbDriveRe);
  if (mAbbDrive) {
    const core4 = `${digitsFix(mAbbDrive[4].slice(0, -1))}${lettersFix(mAbbDrive[4].slice(-1))}`;
    const tail = mAbbDrive[6] ? `-${mAbbDrive[6]}` : '';
    const fixed = `${mAbbDrive[1]}${digitsFix(mAbbDrive[2])}-${digitsFix(mAbbDrive[3])}-${core4}-${digitsFix(mAbbDrive[5])}${tail}`;
    return {
      token: recordIfChanged(s, fixed, 'ABB_ACS_DRIVE_OCR'),
      repairs,
      matchedFamily: 'ABB ACS/ACH Variable Frequency Drive',
      brand: 'ABB',
    };
  }

  // 1d. ABB IEC Motors: M2QA132M4A / M3BP160MLA4
  const abbMotorRe = /^(M[23][QBA][A-Z]{1,2})\s*([0-9OQDIL|]{2,3})([SML][A-Z]?\s*[0-9OQDIL|][A-Z0-9]*)$/;
  const mAbbMotor = s.match(abbMotorRe);
  if (mAbbMotor) {
    const tail = mAbbMotor[3].replace(/\s+/g, '');
    const fixedTail = `${lettersFix(tail.slice(0, -2))}${digitsFix(tail.slice(-2, -1))}${lettersFix(tail.slice(-1))}`;
    const fixed = `${mAbbMotor[1]}${digitsFix(mAbbMotor[2])}${fixedTail}`;
    return {
      token: recordIfChanged(s, fixed, 'ABB_IEC_MOTOR_OCR'),
      repairs,
      matchedFamily: 'ABB IEC Induction Motor',
      brand: 'ABB',
    };
  }

  // 1e. ABB AZ20 / Analyzer slash codes: AZ20/112112221112E/STD
  if (/^AZ[2][0O]\//.test(noSpace)) {
    const parts = noSpace.split('/');
    parts[0] = applyMask(parts[0], 'LLDD');
    if (parts[1] && parts[1].length >= 6) {
      parts[1] = `${digitsFix(parts[1].slice(0, -1))}${lettersFix(parts[1].slice(-1))}`;
    }
    const fixed = parts.join('/');
    return {
      token: recordIfChanged(s, fixed, 'ABB_AZ_ANALYZER_OCR'),
      repairs,
      matchedFamily: 'ABB Combustion / Gas Analyzer',
      brand: 'ABB',
    };
  }

  // 2. Siemens SIMATIC / SITOP / SINAMICS / SIRIUS / SENTRON MLFBs
  // 2a. 16-char MLFB: 6ES7315-2EH14-0AB0, 6SL3210-1PE21-8UL0, 3WL1108-2BB32-1AA2
  const siemens16Re = /^([6][ESAG][SPTLVK][0-9OQDIL|]|[3][RWTvV][WLTFAV][0-9OQDIL|]|[1I][L][EA][0-9OQDIL|])([0-9OQDIL|]{3})([0-9OQDIL|][A-Z0-9]{3}[0-9OQDIL|])([0-9OQDIL|][A-Z0-9]{2}[0-9OQDIL|])$/;
  const mSiem16 = alnum.match(siemens16Re);
  if (mSiem16 && /^(?:6ES|6EP|6SL|6SE|6AV|6GK|3RW|3RT|3RV|3WL|3VA|1LE|1LA)/.test(`${digitsFix(mSiem16[1][0])}${lettersFix(mSiem16[1].slice(1, 3))}`)) {
    const p1 = `${digitsFix(mSiem16[1][0])}${lettersFix(mSiem16[1].slice(1, 3))}${digitsFix(mSiem16[1][3])}`;
    const p2 = digitsFix(mSiem16[2]);
    const b = mSiem16[3];
    const p3 = `${digitsFix(b[0])}${lettersFix(b.slice(1, 3))}${digitsFix(b.slice(3))}`;
    const c = mSiem16[4];
    const p4 = `${digitsFix(c[0])}${lettersFix(c.slice(1, 3))}${digitsFix(c[3])}`;
    const fixed = `${p1}${p2}-${p3}-${p4}`;
    return {
      token: recordIfChanged(s, fixed, 'SIEMENS_16CHAR_MLFB_OCR'),
      repairs,
      matchedFamily: 'Siemens SIMATIC / SINAMICS / SENTRON 16-char MLFB',
      brand: 'Siemens',
    };
  }

  // 2b. 12-char Siemens MLFB (SITOP / SIRIUS): 6EP1332-1LB00, 3RW4026-1BB14
  const siemens12Re = /^([6][E][P][0-9OQDIL|]|[3][R][WTV][0-9OQDIL|])([0-9OQDIL|]{3})([0-9OQDIL|][A-Z0-9]{2}[0-9OQDIL|]{2})$/;
  const mSiem12 = alnum.match(siemens12Re);
  if (mSiem12) {
    const p1 = `${digitsFix(mSiem12[1][0])}${lettersFix(mSiem12[1].slice(1, 3))}${digitsFix(mSiem12[1][3])}`;
    const p2 = digitsFix(mSiem12[2]);
    const b = mSiem12[3];
    const p3 = `${digitsFix(b[0])}${lettersFix(b.slice(1, 3))}${digitsFix(b.slice(3))}`;
    const fixed = `${p1}${p2}-${p3}`;
    return {
      token: recordIfChanged(s, fixed, 'SIEMENS_12CHAR_MLFB_OCR'),
      repairs,
      matchedFamily: 'Siemens SITOP / SIRIUS 12-char MLFB',
      brand: 'Siemens',
    };
  }

  // 2c. Legacy Siemens 3TF / 3TB Contactors with -Z suffix (e.g. real catalog OCR bug 3TF3200-OB-Z -> 3TF3200-0B-Z)
  const siemens3TfRe = /^(3T[FB])([0-9OQDIL|]{4})[-\s]?([0-9OQDIL|])([A-Z0-9]{1,3})(?:[-\s]?(Z))?$/;
  const mSiem3Tf = noSpace.match(siemens3TfRe);
  if (mSiem3Tf) {
    const zPart = mSiem3Tf[5] ? '-Z' : '';
    const fixed = `${mSiem3Tf[1]}${digitsFix(mSiem3Tf[2])}-${digitsFix(mSiem3Tf[3])}${mSiem3Tf[4]}${zPart}`;
    return {
      token: recordIfChanged(s, fixed, 'SIEMENS_3TF_CONTACTOR_OCR'),
      repairs,
      matchedFamily: 'Siemens 3TF/3TB Contactor',
      brand: 'Siemens',
    };
  }

  // 3. Bently Nevada 3300 XL / 3500 Series
  // 3a. 3500/42M-01-00
  const bn3500Re = /^(35[0O]{2})\/([0-9OQDIL|]{2}[A-Z]?)(?:[-\s]+([0-9OQDIL|]{2}))?(?:[-\s]+([0-9OQDIL|]{2}))?(?:[-\s]+([0-9OQDIL|]{2}))?$/;
  const mBn3500 = s.match(bn3500Re);
  if (mBn3500) {
    const mod = mBn3500[2].length === 3
      ? `${digitsFix(mBn3500[2].slice(0, 2))}${lettersFix(mBn3500[2][2])}`
      : digitsFix(mBn3500[2]);
    const segs = [mBn3500[3], mBn3500[4], mBn3500[5]].filter(Boolean).map(digitsFix);
    const fixed = `3500/${mod}${segs.length ? `-${segs.join('-')}` : ''}`;
    return {
      token: recordIfChanged(s, fixed, 'BENTLY_3500_OCR'),
      repairs,
      matchedFamily: 'Bently Nevada 3500 Rack / Monitor',
      brand: 'Bently Nevada',
    };
  }

  // 3b. 330180-91-00, 330130-045-00-05, 330730-040-00-00
  const bn3300Re = /^(33[0O][0-9OQDIL|]{3})(?:[-\s_]+([0-9OQDIL|]{2,3}))+(?:[-\s_]+([0-9OQDIL|]{2}))*$/;
  if (/^33[0O][0-9OQDIL|]{3}[-\s_]/.test(s) && mBn3500 === null) {
    const segs = s.split(/[-\s_]+/).map(digitsFix);
    if (segs.length >= 2 && segs.every((seg) => /^\d{2,6}$/.test(seg))) {
      const fixed = segs.join('-');
      return {
        token: recordIfChanged(s, fixed, 'BENTLY_3300XL_OCR'),
        repairs,
        matchedFamily: 'Bently Nevada 3300 XL Transducer / Cable',
        brand: 'Bently Nevada',
      };
    }
  }
  void bn3300Re;

  // 4. Rosemount 3051 / 2051 / 3144 / 644 Smart Model Strings
  const rosemountRe = /^([32][0O]5[1I][SCTDPGL]{1,2}|3[1I]44P|644[HR])([A-Z0-9OQDIL|-]{6,30})$/;
  const mRose = noSpace.replace(/-/g, '').match(rosemountRe);
  if (mRose) {
    let head = mRose[1];
    if (/^[32][0O]5[1I]/.test(head)) {
      head = `${digitsFix(head.slice(0, 4))}${lettersFix(head.slice(4))}`;
    } else if (/^3[1I]44P/.test(head)) {
      head = '3144P';
    }
    // Repair common Rosemount pressure range & material OCR tokens (e.g. CD2A22A1AB4M5)
    let body = mRose[2]
      .replace(/^([0-9OQDIL|])([A-Z])([0-9OQDIL|]{2})([A-Z])([0-9OQDIL|])/, (_, r, m1, m2, i1, i2) =>
        `${digitsFix(r)}${lettersFix(m1)}${digitsFix(m2)}${lettersFix(i1)}${digitsFix(i2)}`
      );
    const fixed = `${head}${body}`;
    return {
      token: recordIfChanged(s, fixed, 'ROSEMOUNT_TRANSMITTER_OCR'),
      repairs,
      matchedFamily: 'Rosemount Process Transmitter',
      brand: 'Rosemount',
    };
  }

  // 5. Allen-Bradley Bulletin Numbers: 1756-PA75, 1747-L553, 1784-KT, 1769-L33ER, 2080-LC50-24QVB
  const abBulletinRe = /^([1I]7[3456789][0-9OQDIL|]|2[0O]8[0O]|5[0O]69|2[025][FBC])[-\s]?([A-Z]{1,4}[0-9OQDIL|]{0,4}[A-Z0-9]*)(?:[-\s]([A-Z0-9OQDIL|]{2,8}))?$/;
  const mAb = s.match(abBulletinRe);
  if (mAb) {
    const rawBul = mAb[1];
    const bul = /^[2][025][FBC]$/.test(`${digitsFix(rawBul.slice(0, 2))}${lettersFix(rawBul.slice(2))}`)
      ? `${digitsFix(rawBul.slice(0, 2))}${lettersFix(rawBul.slice(2))}`
      : digitsFix(rawBul);
    // Fix O->0 and I->1 inside numeric runs following letters in AB catalog suffixes (e.g. LC5O -> LC50)
    const fixAbSeg = (seg) =>
      seg.replace(/([A-Z]+)([0-9OQDIL|]+)([A-Z]*)/g, (__, l1, d1, l2) => `${l1}${digitsFix(d1)}${l2}`);
    const seg2 = fixAbSeg(mAb[2]);
    const seg3 = mAb[3] ? `-${fixAbSeg(mAb[3])}` : '';
    const fixed = `${bul}-${seg2}${seg3}`;
    return {
      token: recordIfChanged(s, fixed, 'ALLEN_BRADLEY_BULLETIN_OCR'),
      repairs,
      matchedFamily: 'Allen-Bradley Logix / SLC / Micro800 / PowerFlex',
      brand: 'Allen-Bradley',
    };
  }

  // 6. Schneider Electric Modicon Quantum (140CPS11420), Modicon M340/M580 (BMXP342020), TeSys (LC1D25M7), Altivar (ATV630U75N4)
  const schQuantumRe = /^([1I]4[0O])([A-Z]{3})([0-9OQDIL|]{5})$/;
  const mSchQ = alnum.match(schQuantumRe);
  if (mSchQ) {
    const fixed = `140${lettersFix(mSchQ[2])}${digitsFix(mSchQ[3])}`;
    return {
      token: recordIfChanged(s, fixed, 'SCHNEIDER_QUANTUM_OCR'),
      repairs,
      matchedFamily: 'Schneider Electric Modicon Quantum',
      brand: 'Schneider Electric',
    };
  }

  const schTesysRe = /^(LC[1I]D|LRD|ATV)([0-9OQDIL|]{2,3})([A-Z0-9]*)$/;
  const mSchT = alnum.match(schTesysRe);
  if (mSchT) {
    const head = mSchT[1].startsWith('LC') ? 'LC1D' : mSchT[1];
    const fixed = `${head}${digitsFix(mSchT[2])}${mSchT[3]}`;
    return {
      token: recordIfChanged(s, fixed, 'SCHNEIDER_TESYS_ALTIVAR_OCR'),
      repairs,
      matchedFamily: 'Schneider Electric TeSys / Altivar',
      brand: 'Schneider Electric',
    };
  }

  if (/^BM[EX][A-Z][0-9OQDIL|]{4,6}[A-Z0-9]*$/.test(alnum)) {
    const fixed = `${lettersFix(alnum.slice(0, 4))}${digitsFix(alnum.slice(4, 10))}${alnum.slice(10)}`;
    return {
      token: recordIfChanged(s, fixed, 'SCHNEIDER_MODICON_X80_OCR'),
      repairs,
      matchedFamily: 'Schneider Electric Modicon M340 / M580',
      brand: 'Schneider Electric',
    };
  }

  // 7. Yokogawa FA-M3 / CENTUM VP / EJA-EJX
  const yokoFaRe = /^(F3[A-Z]{2})([0-9OQDIL|]{2})[-\s]?([0-9OQDIL|][A-Z0-9])$/;
  const mYokoFa = noSpace.match(yokoFaRe);
  if (mYokoFa) {
    const sfx = `${digitsFix(mYokoFa[3][0])}${lettersFix(mYokoFa[3][1])}`;
    const fixed = `${mYokoFa[1]}${digitsFix(mYokoFa[2])}-${sfx}`;
    return {
      token: recordIfChanged(s, fixed, 'YOKOGAWA_FAM3_OCR'),
      repairs,
      matchedFamily: 'Yokogawa FA-M3 PLC Module',
      brand: 'Yokogawa',
    };
  }

  const yokoCentumRe = /^(AA[IV]|AD[VI]|AFV|ALR|CP)([0-9OQDIL|]{3})(?:[-\s]?([SP][0-9OQDIL|]{2}))?$/;
  const mYokoCen = noSpace.match(yokoCentumRe);
  if (mYokoCen) {
    const sfx = mYokoCen[3] ? `-${lettersFix(mYokoCen[3][0])}${digitsFix(mYokoCen[3].slice(1))}` : '';
    const fixed = `${mYokoCen[1]}${digitsFix(mYokoCen[2])}${sfx}`;
    return {
      token: recordIfChanged(s, fixed, 'YOKOGAWA_CENTUM_OCR'),
      repairs,
      matchedFamily: 'Yokogawa CENTUM VP I/O & Controller',
      brand: 'Yokogawa',
    };
  }

  if (/^EJ[AX][0-9OQDIL|]{3}[A-Z]/.test(noSpace)) {
    const segs = s.split(/[-\s]+/);
    segs[0] = `${segs[0].slice(0, 3)}${digitsFix(segs[0].slice(3, 6))}${lettersFix(segs[0].slice(6))}`;
    const fixed = segs.join('-');
    return {
      token: recordIfChanged(s, fixed, 'YOKOGAWA_DPHARP_OCR'),
      repairs,
      matchedFamily: 'Yokogawa DPharp Pressure Transmitter',
      brand: 'Yokogawa',
    };
  }

  // 8. Hagglunds Radial Piston Hydraulic Motors: CA70-60, CA140-120, CB400-360, CBM-2000
  const haggRe = /^(CA|CB|CBM)[-\s]?([0-9OQDIL|]{2,4})(?:[-\s]+([0-9OQDIL|]{2,4}))?$/;
  const mHagg = s.match(haggRe);
  if (mHagg && (brandHint === 'Hagglunds' || mHagg[1] === 'CBM' || Boolean(mHagg[3]))) {
    const p2 = digitsFix(mHagg[2]);
    const p3 = mHagg[3] ? `-${digitsFix(mHagg[3])}` : '';
    const sep = mHagg[1] === 'CBM' ? '-' : '';
    const fixed = `${mHagg[1]}${sep}${p2}${p3}`;
    return {
      token: recordIfChanged(s, fixed, 'HAGGLUNDS_HYDRAULIC_OCR'),
      repairs,
      matchedFamily: 'Hagglunds Radial Piston Hydraulic Motor',
      brand: 'Hagglunds',
    };
  }

  // 9. EagleBurgmann Mechanical Seals: MG13/28-Z, MG1-35/G60, M74S2/125-G95A, H74D/45, CARTEX-SN/45
  const ebMgRe = /^(MG[1I][23S]?)[/-]([0-9OQDIL|]{2,3})(?:[-/]([A-Z0-9OQDIL|]{1,5}))?$/;
  const mEbMg = noSpace.match(ebMgRe);
  if (mEbMg) {
    const head = `MG1${mEbMg[1].slice(3)}`;
    const size = digitsFix(mEbMg[2]);
    const tail = mEbMg[3] ? `-${mEbMg[3]}` : '';
    const fixed = `${head}/${size}${tail}`;
    return {
      token: recordIfChanged(s, fixed, 'EAGLEBURGMANN_MG_SEAL_OCR'),
      repairs,
      matchedFamily: 'EagleBurgmann Elastomer Bellows Mechanical Seal',
      brand: 'EagleBurgmann',
    };
  }

  const ebM74Re = /^([MH]74[A-Z0-9]{0,3}|CARTEX-[A-Z]{2,3})[/-]([0-9OQDIL|]{2,3})(?:[-/]([A-Z0-9OQDIL|]{2,6}))?$/;
  const mEb74 = noSpace.match(ebM74Re);
  if (mEb74) {
    const size = digitsFix(mEb74[2]);
    const tail = mEb74[3] ? `-${mEb74[3]}` : '';
    const fixed = `${mEb74[1]}/${size}${tail}`;
    return {
      token: recordIfChanged(s, fixed, 'EAGLEBURGMANN_PROCESS_SEAL_OCR'),
      repairs,
      matchedFamily: 'EagleBurgmann Process / Cartridge Mechanical Seal',
      brand: 'EagleBurgmann',
    };
  }

  return {
    token: s.replace(/\s+/g, '-'),
    repairs,
    matchedFamily: null,
    brand: brandHint,
  };
}

/**
 * Classify the OEM brand family for a raw or normalized part number.
 *
 * @param {string} mpnInput
 * @param {string} [explicitBrand]
 * @returns {{ brand: string|null, family: string|null, confidence: 'HIGH'|'MEDIUM'|'LOW' }}
 */
export function classifyOemBrand(mpnInput, explicitBrand = '') {
  const res = normalizeMpn(mpnInput, { brandHint: explicitBrand });
  return {
    brand: res.brand,
    family: res.matchedFamily,
    confidence: res.confidence,
  };
}

/**
 * Normalize an industrial OEM Manufacturer Part Number (MPN) into a deterministic
 * canonical key, handle-safe slug, compact alphanumeric key, and OCR audit trail.
 *
 * @param {string} rawInput Raw MPN or noisy ERP cell
 * @param {{ brandHint?: string }} [options]
 */
export function normalizeMpn(rawInput, options = {}) {
  const original = String(rawInput ?? '');
  const trimmed = original.trim();
  if (!trimmed) {
    return {
      original,
      canonicalMpn: '',
      compactKey: '',
      catalogSlugCandidate: '',
      brand: null,
      matchedFamily: null,
      revisionOrSeries: null,
      ocrRepaired: false,
      repairs: [],
      searchAliases: [],
      confidence: 'LOW',
    };
  }

  const brandHint = detectBrandHint(trimmed, options.brandHint || '');

  // Strip leading brand / condition prefixes ("Original ABB 3BDS005799R1" -> "3BDS005799R1")
  let working = trimmed
    .normalize('NFKC')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/^[#*:;\s]+|[.,;:\s]+$/g, '')
    .replace(BRAND_PREFIX_STRIP_RE, '')
    .trim();

  // Extract optional trailing packaging/series/rev annotation (e.g., "/SER B", "REV C", "NEW")
  let revisionOrSeries = null;
  const pkgMatch = working.match(PACKAGING_SUFFIX_RE);
  if (pkgMatch) {
    revisionOrSeries = (pkgMatch[1] || pkgMatch[2] || '').toUpperCase() || null;
    working = working.slice(0, pkgMatch.index).trim();
  } else if (/^(?:[1I]7[0-9OQDIL|]{2}|2[0O]8[0O]|5[0O]69)-[A-Z0-9OQDIL|-]+\/[A-Z]$/i.test(working)) {
    revisionOrSeries = working.slice(-1).toUpperCase();
    working = working.slice(0, -2);
  }

  const repaired = repairOcrConfusions(working, brandHint);
  const canonicalMpn = repaired.token;
  const compactKey = canonicalMpn.replace(/[^A-Z0-9]/g, '');
  const catalogSlugCandidate = canonicalMpn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const aliasSet = new Set([canonicalMpn, compactKey, catalogSlugCandidate]);
  if (canonicalMpn.includes('/')) {
    aliasSet.add(canonicalMpn.replace(/\//g, '-'));
  }

  const finalBrand = repaired.brand || brandHint;
  const confidence = repaired.matchedFamily
    ? 'HIGH'
    : finalBrand
      ? 'MEDIUM'
      : 'LOW';

  return {
    original,
    canonicalMpn,
    compactKey,
    catalogSlugCandidate,
    brand: finalBrand,
    matchedFamily: repaired.matchedFamily,
    revisionOrSeries,
    ocrRepaired: repaired.repairs.length > 0,
    repairs: repaired.repairs,
    searchAliases: Array.from(aliasSet).filter(Boolean),
    confidence,
  };
}

/**
 * Parse a free-text BOM line (e.g. "Line 1: Siemens 6ES7 315-2EH14-0AB0 | Qty: 4 PCS")
 * into structured MPN + quantity + UOM.
 *
 * @param {string} line
 */
export function parseBomLine(line) {
  const raw = String(line ?? '').trim();
  if (!raw) {
    return null;
  }

  let qty = 1;
  let uom = 'EA';
  const qtyMatch = raw.match(/(?:\bqty\s*[:=]?\s*|\bx\s*)(\d{1,6})\s*(pcs?|ea|units?|sets?)?\b/i)
    || raw.match(/\b(\d{1,5})\s*(pcs|ea|sets)\b/i);
  if (qtyMatch) {
    qty = Number.parseInt(qtyMatch[1], 10) || 1;
    if (qtyMatch[2]) {
      const u = qtyMatch[2].toUpperCase();
      uom = u.startsWith('PC') ? 'PCS' : u.startsWith('SET') ? 'SET' : 'EA';
    }
  }

  const cleanedLine = raw
    .replace(/^(?:line|item|#)\s*\d+\s*[:.)-]?\s*/i, '')
    .replace(/\|.*$/, '')
    .replace(/(?:\bqty\s*[:=]?\s*|\bx\s*)\d{1,6}\s*(?:pcs?|ea|units?|sets?)?\b/gi, '')
    .replace(/\b\d{1,5}\s*(?:pcs|ea|sets)\b/gi, '')
    .trim();

  const normalized = normalizeMpn(cleanedLine);
  return {
    ...normalized,
    quantity: qty,
    uom,
  };
}
