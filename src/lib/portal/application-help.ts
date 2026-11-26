/** Mirrors the Replit portal Help Desk topics (artifacts/field-training/src/lib/application-help.ts). */
export type Role = 'fto' | 'fto_coordinator' | 'fto_sgt' | 'po' | 'fto_coc' | 'policenet' | 'policenet_admin_sgt';

type ApplicationHelpAudience = 'all' | readonly Role[];

export type ApplicationHelpTopic = {
  id: string;
  title: string;
  roles: ApplicationHelpAudience;
  keywords: string;
  steps: readonly string[];
  expectedResult: string;
  recovery: string;
};

// PO Progress is a development preview; its status definitions ship with it.
const PO_PROGRESS_TOPICS: readonly ApplicationHelpTopic[] = [
  {
    id: 'po-status',
    title: "Read a PO's progress status",
    roles: ['fto_coordinator', 'fto_sgt'],
    keywords: 'PO Progress status below standard emerging concern meets standard NRT UA previously flagged',
    steps: [
      "Each rated week is banded by the UA's on the signed daily records.",
      "MEETS STANDARD: 0-9 UA's in the week.",
      "EMERGING CONCERN: 10-19 UA's in the week.",
      "BELOW STANDARD: 20 or more UA's, 3 or more UA's in one category, or an NRT in the week.",
      'A worse week raises the status to that band. Each rated week that meets standard lowers it one level. A flag can last the whole program.',
      'Limbo weeks are not rated and do not count. Late packets count toward the FTO, not the PO.',
    ],
    expectedResult: 'SHOW CALCULATION in the PO panel lists every rated week, its band and the status after it, with the formula version. A PO who cleared a flag shows a PREVIOUSLY FLAGGED tag with the week it cleared. Status is based on documented ratings; it is not a release recommendation.',
    recovery: 'If a status looks wrong, open the PO and check the week strip and the category ratings for each rated week.',
  },
];

// Page notes moved off the screens. Wording is kept as it was on each page.
const PAGE_NOTE_TOPICS: readonly ApplicationHelpTopic[] = [
  {
    id: 'page-resources',
    title: 'Resources page notes',
    roles: ['fto', 'fto_coordinator', 'fto_sgt', 'po', 'fto_coc'],
    keywords: 'resources library catalog directives geography map cruiser districts law handbook',
    steps: [
      'A focused catalog of signed-in uploaded files, official division directive PDFs, and the geography map.',
      'Catalog results include only the sources listed here.',
      'Explore the supplied map in an interactive view.',
    ],
    expectedResult: 'Operational requirements belong to official agency sources.',
    recovery: 'If the embedded map does not load, use “Open Original Map.” Confirm current geography and assignments through official agency sources.',
  },
  {
    id: 'page-home',
    title: 'Home page notes',
    roles: ['fto', 'fto_coordinator'],
    keywords: 'home dashboard phase extension NRT review inbox alert preview',
    steps: [
      'This sample shows the FTO extension-request area. Submission is disabled; previews never read or write shared requests.',
      'Fictional request shown for preview only. Review actions and shared-service access are disabled.',
      'Fictional preview data stays in memory and clears on refresh. No request or decision is sent.',
    ],
    expectedResult: 'Requests and review decisions are stored by the authenticated agency service and are available across devices.',
    recovery: 'NRT review inbox: no alert has been sent to the FTO for these requests.',
  },
  {
    id: 'page-my-pos',
    title: "My PO's and class roster notes",
    roles: ['fto', 'fto_coordinator'],
    keywords: "my PO's class roster overview substitute coverage workbook export follow-up",
    steps: [
      'Only PO’s assigned to the signed-in department email appear. Substitute access is unavailable until a shared coverage service confirms it.',
      'The roster lists PO’s even when they have no daily logs yet. Substitute coverage creates a new day without changing the regular FTO assignment.',
      'Open a phase case folder, set its training class, and save daily logs to populate this local overview.',
      'Workbook export uses only the currently filtered local reports. Export does not transmit records to a server.',
    ],
    expectedResult: 'No matching FTO directory entry means no FTO directory entry matches the signed-in department email, so no class or PO records are shown.',
    recovery: 'If the roster shows None, the FTO Coordinator must import the roster first.',
  },
  {
    id: 'page-orientation',
    title: 'Substation orientation notes',
    roles: ['fto', 'fto_coordinator'],
    keywords: 'substation orientation walkthrough checklist first shift phase review confirm',
    steps: [
      'Complete this before the first shift of each phase. The form is dated for the phase’s first scheduled workday.',
      'Every checklist item starts checked for quick review; clear anything not completed during the walkthrough, then confirm the review before saving.',
      'Enter the substation number, then press Tab or Enter to show its details.',
      'FTO / PO walkthrough record, not a performance rating. Check a category only when every listed task was covered; a dashed box means some of its tasks are still open.',
      'After walking through every category with the PO, confirm the review below the list.',
    ],
    expectedResult: 'Review confirmed shows after the review is confirmed. Any further edit clears this confirmation.',
    recovery: 'Values stay in this device’s local workspace. Test values remain in memory and clear when the preview refreshes.',
  },
  {
    id: 'page-daily-records',
    title: 'Daily records and packet transfer notes',
    roles: ['fto', 'fto_coordinator', 'po'],
    keywords: 'daily records packet transfer save locally sync drafts finalize shared records refresh filters',
    steps: [
      'Each record covers one shift/day and contains its related duty, run, activity, and evaluation forms. Open a saved record to review or continue it; weekly totals are assembled separately from eligible records.',
      'Save Locally writes to the encrypted device vault. When online, a separate draft sync may follow; saving never submits or finalizes a packet.',
      'Server drafts stay outside Coordinator and PO review until finalized.',
      'Only the assigned, server-verified FTO may synchronize or finalize a packet. Draft sync stays editable and is not a submission, signature, approval, or PO release.',
      'Refresh never uploads, replaces, or merges local drafts. The server checks your authorized roster on every page and returns at most 100 records at a time.',
      'Dates include both endpoints. Applying filters starts a new search from the newest matching packet.',
    ],
    expectedResult: 'Not Loaded means shared records have not been requested yet. Choose Refresh Shared Records to request authorized copies.',
    recovery: 'In a UI preview, agency reads and uploads are disabled.',
  },
  {
    id: 'page-agency-packets',
    title: 'Agency packets and packet status notes',
    roles: ['fto', 'fto_coordinator', 'po', 'fto_coc'],
    keywords: 'agency packets packet status submissions read-only scope server role receipt approval release',
    steps: [
      'FTO Coordinator: review PO-screened packets, acknowledge receipt, approve, then release separately. Packets enter your inbox only after the PO reviews their own UA details and counts. Receipt is separate from approval and release.',
      'PO: review only your own UA details and period counts; acknowledge receipt after Coordinator release. Review only your own UA details and daily, weekly, and monthly counts before Coordinator routing.',
      'FTO: read packets in your assigned classes. You can correct only your own returned packets.',
      'Other roles: read-only packets for classes assigned to your verified account.',
      'Access is scoped by the agency server. Role shown here comes only from the server response.',
      'FTO Coordinator: the list is scoped by the agency server to your authorized training classes.',
      'PO: only packets the server released to you are shown. When your Coordinator releases a packet, your own summary appears. Draft and withdrawn packets remain hidden.',
      'FTO and other roles: submitted daily records for your authorized classes appear here. Read access does not grant another role’s actions; workflow actions remain limited to their assigned roles.',
    ],
    expectedResult: 'Packet snapshot unavailable means no record details are shown and no packet state has been changed.',
    recovery: 'Packet submissions are not loaded in UI previews. No shared records are shown.',
  },
  {
    id: 'page-account-settings',
    title: 'Account settings notes',
    roles: ['fto', 'fto_coordinator', 'po'],
    keywords: 'account settings local queue encrypted storage eviction preview memory',
    steps: [
      'The local queue is encrypted on this device and is not uploaded.',
      'This fictional UI preview is held in memory only and is cleared when the page refreshes. No test content is written to browser storage.',
    ],
    expectedResult: 'The local queue is encrypted on this device and is not uploaded.',
    recovery: 'Persistent storage can reduce automatic browser eviction, but it cannot protect against clearing site data, device loss, or storage failure.',
  },
  {
    id: 'page-assignments',
    title: 'Assignments page notes',
    roles: ['fto_coordinator'],
    keywords: 'assignments phase setup roster import email draft week dates universal assignment',
    steps: [
      'The date ranges set the workbook’s phase-week tabs. Extra approved weeks are included with Week 4 in Excel.',
      'The universal FTO assignment is a user-requested option and is not established by the SOP.',
      'Editing this form updates the current case-folder values; saved reports remain unchanged.',
      'Roster changes are saved on this device only. Importing does not activate phases, invite PO’s, confirm roles, or make the roster official.',
      'Import one row per PO assignment. Imported names stay on this device.',
      'CSV, Excel XLSX, or Word DOCX table with a header row · up to 2 MB · required: class, PO name/badge, FTO name/badge, and phase start date.',
    ],
    expectedResult: 'The button opens a draft in your email app. Check the recipient and message, then send it from there.',
    recovery: 'Add both PO and FTO emails to enable the email draft.',
  },
  {
    id: 'page-coverage',
    title: 'Day-off coverage notes',
    roles: ['fto', 'fto_coordinator'],
    keywords: 'coverage substitute FTO day off request notify accept decline',
    steps: [
      'Coverage requests are saved on this device only.',
      'Other FTO’s are not notified and cannot accept or decline it here.',
      'Saving does not notify another account or create a substitute daily form.',
      'A request must be delivered to the FTO team before anyone can respond. No response buttons are shown for requests that have not been sent.',
    ],
    expectedResult: 'None means no local requests are saved on this device.',
    recovery: 'Do not begin substitute work until a covering FTO has accepted and the Coordinator confirms the assignment.',
  },
  {
    id: 'page-command-review',
    title: 'Submitted packets notes',
    roles: ['fto_coc'],
    keywords: 'FTO COC command review submitted packets queue',
    steps: [
      'Only completed and submitted packets belong in this queue.',
      'Drafts and unfinished packets do not appear here.',
      'A packet is completed, it is submitted for command review, and then it appears in this queue.',
    ],
    expectedResult: 'When a completed packet is submitted, it is meant to show here.',
    recovery: 'Packet review, export, printing, comments, and return-for-review are unavailable.',
  },
  {
    id: 'page-po-access',
    title: 'PO account access notes',
    roles: ['po'],
    keywords: 'PO account access verify email class phase activation invitation',
    steps: [
      'Verify your department email.',
      'Confirm your class assignment.',
      'Wait for class and phase activation.',
    ],
    expectedResult: 'Your own training records appear after your department email is verified and your class and phase are activated.',
    recovery: 'If an invitation or activation is missing, follow your established department process.',
  },
  {
    id: 'page-technical-access',
    title: 'Technical access notes',
    roles: ['policenet', 'policenet_admin_sgt'],
    keywords: 'POLICENET technical access prepare test delete records two approvals SGT LT boundary',
    steps: [
      'POLICENET staff prepare and test technical changes. Plan the change, then use an approved test environment.',
      'Deleting training records requires separate approval from a POLICENET admin with SGT rank and one with LT rank. This portal does not offer deletion.',
      'The two-person rule applies only to deleting training records. It does not apply to other technical work.',
      'Technical roles cannot change training judgments or bypass operational access rules.',
    ],
    expectedResult: 'Technical roles cannot open operational training records.',
    recovery: 'If approved test tools are needed, request them through your established POLICENET process.',
  },
];

export const APPLICATION_HELP_TOPICS: readonly ApplicationHelpTopic[] = [
  {
    id: 'local-save',
    title: 'Save and reopen a local draft',
    roles: 'all',
    keywords: 'save locally passphrase encrypted unlock reopen',
    steps: [
      'Choose Save locally. Create a passphrase if this is your first save.',
      'To continue later on this device, choose Unlock saved work and enter that passphrase.',
    ],
    expectedResult: 'The last successful save is encrypted on this device. It is not uploaded.',
    recovery: 'If saving fails, keep the page open and retry. Do not leave until the save succeeds.',
  },
  {
    id: 'record-status',
    title: 'Check record status',
    roles: 'all',
    keywords: 'unsaved saved pending uploaded server confirmed online offline',
    steps: [
      'Unsaved changes remain on screen only.',
      'Saved locally means the draft is on this device.',
      'Pending means no server confirmation has been received.',
      'Server-confirmed means the service confirmed the record.',
    ],
    expectedResult: 'Online or offline describes the connection. It does not confirm a save or submission.',
    recovery: 'If no confirmation appears, do not treat the record as submitted. Refresh its status before retrying.',
  },
  {
    id: 'fto-sergeant-access',
    title: 'Understand FTO Sergeant access',
    roles: ['fto_sgt'],
    keywords: 'FTO Sergeant assigned class monitoring assignment management Coordinator COC scope',
    steps: [
      'Use class-monitoring or assignment-management actions only when they are enabled for your assigned scope.',
      'Coordinator roster controls and COC packet review are separate roles.',
    ],
    expectedResult: 'FTO Sergeant access does not include editing narratives, ratings, or statistics by default.',
    recovery: 'If an expected action is unavailable, confirm the assigned scope with the authorized Coordinator.',
  },
  {
    id: 'shift-sheet',
    title: 'Leave an edited shift sheet',
    roles: ['fto'],
    keywords: 'leave close navigate unsaved changes warning stay report',
    steps: [
      'Save the draft locally before leaving, or stay on the page and finish your edits.',
      'If warned, choose Stay and keep working to return to the sheet.',
    ],
    expectedResult: 'Leaving without saving does not keep edits that are still on screen.',
    recovery: 'If you already left, reopen the last successful local draft. Unsaved edits cannot be restored.',
  },
  {
    id: 'roster-import',
    title: 'Import a roster',
    roles: ['fto_coordinator'],
    keywords: 'roster import csv xlsx excel docx word template assignment fto po',
    steps: [
      'Download the CSV template, or choose a CSV, Excel XLSX, or Word DOCX table with a header row. Files can be up to 2 MB.',
      'Include class, PO name and badge, FTO name and badge, and phase start date. Phase defaults to Phase I when omitted.',
      'Use one row per PO assignment. Repeating an FTO badge reuses that FTO record; a row with blank PO fields adds an FTO only.',
      'For 80C-1 or 80C-2, include Zone, Precinct, Shift, and the mapped Cruiser District.',
      'Review the import preview, correct errors, then add the roster to this device.',
    ],
    expectedResult: 'Imported names and assignments stay on this device until you save the workspace. Shift, days off, emails, and patrol assignment are optional. Import does not activate a phase or grant account access.',
    recovery: 'Correct any reported row errors in the file and import it again. Save locally to keep the roster on this device.',
  },
  {
    id: 'account-access',
    title: 'Activate an account',
    roles: ['po'],
    keywords: 'account sign in invitation activation class phase access',
    steps: [
      'Sign in with your approved staff account.',
      'Account activation is invitation-only; self-service sign-up is not available.',
      'Training records appear after the account, class, and phase access are confirmed.',
    ],
    expectedResult: 'An invitation is required before portal access is available.',
    recovery: 'If you do not have an invitation or your class is not active, follow your established department process.',
  },
  {
    id: 'packet-status',
    title: 'Check an agency packet action',
    roles: ['po', 'fto', 'fto_coordinator', 'fto_coc'],
    keywords: 'packet release withdrawal acknowledge pending refresh retry status',
    steps: [
      'After an action, check the packet status for confirmation.',
      'If the result is pending, refresh the packet list before retrying.',
      'Use the same retry action when one is shown.',
    ],
    expectedResult: 'A completed status confirms the action. Acknowledgment confirms receipt and review, not agreement or an electronic signature.',
    recovery: 'If the status remains unclear, refresh again before retrying. Withdrawal permanently closes a packet.',
  },
  {
    id: 'phase-request',
    title: 'Check a phase-extension request',
    roles: ['fto', 'fto_coordinator'],
    keywords: 'phase extension request local draft send coordinator approval submitted pending denied approved',
    steps: [
      'Submit the request after entering the extension type, number of weeks, and written justification.',
      'Check whether the request is awaiting Coordinator review or is still saved on this device.',
      'If a saved request is shown, use Send saved request when the service is available.',
    ],
    expectedResult: 'A request saved on this device is not submitted. Awaiting Coordinator review means the request was submitted.',
    recovery: 'If submission is not confirmed, keep the local draft and use Send saved request. Check the request status again before retrying.',
  },
  ...PAGE_NOTE_TOPICS,
  // PO Progress is live on this site, so its status definitions are always shown.
  ...PO_PROGRESS_TOPICS,
];

export function getApplicationHelpTopicsForRole(role: Role): readonly ApplicationHelpTopic[] {
  if (role === 'fto' || role === 'fto_sgt' || role === 'fto_coordinator' || role === 'fto_coc') {
    return APPLICATION_HELP_TOPICS;
  }
  return APPLICATION_HELP_TOPICS.filter(topic =>
    topic.roles === 'all' || topic.roles.includes(role),
  );
}

export function getApplicationHelpTopicForRole(
  role: Role,
  topicId: string | null | undefined,
): ApplicationHelpTopic {
  const topics = getApplicationHelpTopicsForRole(role);
  return topics.find(topic => topic.id === topicId) ?? topics[0];
}
