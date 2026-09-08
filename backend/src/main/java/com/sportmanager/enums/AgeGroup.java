package com.sportmanager.enums;

public enum AgeGroup {
    OLD_GAN_HADAR,
    YOUNG_GAN_RIMON,
    OLD_GAN_RIMON,
    GRADE_1,
    GRADE_2,
    GRADE_3,
    GRADE_4,
    GRADE_5,
    GRADE_6;

    public String hebrewLabel() {
        return switch (this) {
            case OLD_GAN_HADAR -> "גן הדר בוגר";
            case YOUNG_GAN_RIMON -> "גן רימון צעיר";
            case OLD_GAN_RIMON -> "גן רימון בוגר";
            case GRADE_1 -> "כיתה א׳";
            case GRADE_2 -> "כיתה ב׳";
            case GRADE_3 -> "כיתה ג׳";
            case GRADE_4 -> "כיתה ד׳";
            case GRADE_5 -> "כיתה ה׳";
            case GRADE_6 -> "כיתה ו׳";
        };
    }
}
