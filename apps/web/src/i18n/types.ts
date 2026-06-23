export type Language = "en" | "zh";

export type TextId = string;

export type TranslationParams = Record<string, string | number>;

export type MessageDictionary = Record<TextId, string>;
