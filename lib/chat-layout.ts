/**
 * The width a conversation is read at (SPEC-355) — one class for the thread, the composer
 * and the skeleton, so the three always line up. Wide enough that an answer's table fits
 * without scrolling and the sides are not empty on a desktop; centred on wider screens.
 */
export const CHAT_COLUMN_CLASS = "mx-auto w-full max-w-6xl";

/** The share of the column a question's bubble may take. */
export const QUESTION_BUBBLE_WIDTH = "max-w-[80%]";
