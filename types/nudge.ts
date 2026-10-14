/** A nudge on the button (SPEC-246 / backend SPEC-254): the one figure worth a
 * look on the current page, worded by the backend over a number it already
 * computed. `null` when there is nothing to say. */
export interface Nudge {
  /** Stable while the figure is materially the same — the dismissal key. */
  id: string;
  /** The sidebar title of the page the rule belongs to. */
  page: string;
  /** The sentence, plain text; `figure` is the part to set in bold. */
  line: string;
  figure: string;
  /** The primary button's label. */
  action: string;
  /** The question sent to the analyst — the same shape as ✦ Explain. */
  question: string;
  /** `context.focus` for that question (backend SPEC-249). */
  focus: string;
  /** The page that lists the records behind the figure, when there is one. */
  href: string | null;
}

export interface NudgeResponse {
  nudge: Nudge | null;
}
