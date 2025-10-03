import { _decorator } from 'cc';

// We create an enum for our text "keys". This prevents typos.
export enum ETextKey {
    PLAY,
    RESTART,
    JUMP,
    POWERUP_SPEED,
    POWERUP_MAGNET,
    POWERUP_CHILLIES,
    ENGLISH,
    HINDI,
    HIGH_SCORE,
    INFO_1_TITLE,
    INFO_1_DESC,
    INFO_2_TITLE,
    INFO_2_DESC,
    INFO_3_TITLE,
    INFO_3_DESC,
    // Add any new text keys here
}

// This is our translation database.
// 'en' = English, 'hi' = Hindi, 'en_HI' = Hinglish
export const localizationData = {
    'en': {
        [ETextKey.PLAY]: "PLAY",
        [ETextKey.RESTART]: "RESTART",
        [ETextKey.JUMP]: "JUMP",
        [ETextKey.POWERUP_SPEED]: "SPEED",
        [ETextKey.POWERUP_MAGNET]: "MAGNET",
        [ETextKey.POWERUP_CHILLIES]: "CHILLIES",
        [ETextKey.ENGLISH]: "ENGLISH",
        [ETextKey.HINDI]: "हिन्दी",
        [ETextKey.HIGH_SCORE]: "HIGH SCORE !",
        [ETextKey.INFO_1_TITLE]: "DASHER\nLIVES",
        [ETextKey.INFO_1_DESC]: "AVOID THE OBSTACLES &\nCOLLECT CHILLIES",
        [ETextKey.INFO_2_TITLE]: "CHILLI\nPOWERS",
        [ETextKey.INFO_2_DESC]: "USE OUR NEW CHILLI\nBOOSTED FLAVOURS",
        [ETextKey.INFO_3_TITLE]: "DISCOUNT\nCOUPON",
        [ETextKey.INFO_3_DESC]: "WIN EXCITING DISCOUNTS\n& SHARE SCORES",
    },
    'hi': {
        [ETextKey.PLAY]: "खेलें",
        [ETextKey.RESTART]: "फिर से शुरू करें",
        [ETextKey.JUMP]: "जम्प",
        [ETextKey.POWERUP_SPEED]: "स्पीड",
        [ETextKey.POWERUP_MAGNET]: "मैगनेट",
        [ETextKey.POWERUP_CHILLIES]: "चिलीज़",
        [ETextKey.ENGLISH]: "ENGLISH",
        [ETextKey.HINDI]: "हिन्दी",
        [ETextKey.HIGH_SCORE]: "उच्च स्कोर !",
        [ETextKey.INFO_1_TITLE]: "डैशर\nजीवित है",
        [ETextKey.INFO_1_DESC]: "बाधाओं से बचें और\nमिर्च इकट्ठा करें",
        [ETextKey.INFO_2_TITLE]: "मिर्च की\nशक्ति",
        [ETextKey.INFO_2_DESC]: "हमारे नए मिर्च-युक्त\nस्वादों का उपयोग करें",
        [ETextKey.INFO_3_TITLE]: "डिस्काउंट\nकूपन",
        [ETextKey.INFO_3_DESC]: "रोमांचक छूट जीतें\nऔर स्कोर साझा करें",
    },
    'en_HI': {
        [ETextKey.PLAY]: "PLAY",
        [ETextKey.RESTART]: "RESTART",
        [ETextKey.JUMP]: "JUMP",
        [ETextKey.POWERUP_SPEED]: "RAFTAAR",
        [ETextKey.POWERUP_MAGNET]: "CHUMBAK",
        [ETextKey.POWERUP_CHILLIES]: "CHILLIES",
        [ETextKey.ENGLISH]: "ENGLISH",
        [ETextKey.HINDI]: "HINGLISH",
        [ETextKey.HIGH_SCORE]: "Uchch Skor !",
        [ETextKey.INFO_1_TITLE]: "Daishar\nJeevit hai",
        [ETextKey.INFO_1_DESC]: "Baadhaon se bachen aur\nmirch ikattha karen",
        [ETextKey.INFO_2_TITLE]: "Mirch kee\nShakti",
        [ETextKey.INFO_2_DESC]: "Hamaare nae mirch-yukt\nsvaadon ka upayog karen",
        [ETextKey.INFO_3_TITLE]: "Diskaunt\nKoopan",
        [ETextKey.INFO_3_DESC]: "Romaanchak chhoot jeeten\naur skor saajha karen",
    }
};
