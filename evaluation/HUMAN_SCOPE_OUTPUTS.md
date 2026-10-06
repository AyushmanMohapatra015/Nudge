# Scope review packet — second pass

Read this only after recording decisions from HUMAN_SCOPE_CASES.md. These are six previously saved fictional model analyses, copied without rewriting their five analysis fields. They are recorded outputs, not a running model, suggested answers, human judgements, or approved quotes. Reviewing this document makes no network request.

The first response was recovered read-only after its Markdown wrapper was rejected, and the formatting fix was checked offline. The other five completed through the live adapter. Outputs span three development prompt versions; later corrections are not hidden. Original receipts remain ignored locally. No conversation IDs, account URLs, provider reasoning or credentials are included. The live model is not being tested by opening this file.

## mixed-checkout

```json
{
  "classification": "additional",
  "summary": "Request has two parts. Changing the heading colour is a minor colour revision within round one, which is included under the agreed two revision rounds. Adding online checkout is explicitly excluded from the agreement, which covers only a simple email enquiry form and excludes online payments and ecommerce.",
  "references": [
    "S3",
    "S5"
  ],
  "questions": [],
  "deliverables": [
    "Add online checkout functionality"
  ]
}
```

## revision-count

```json
{
  "classification": "ambiguous",
  "summary": "Client requests an additional revision round. The agreement includes two rounds of minor text, colour, and spacing revisions, with further rounds excluded, but the evidence does not state how many of the two included rounds have already been used, so it cannot be determined whether this request falls within the included allowance or exceeds it.",
  "references": [
    "S3"
  ],
  "questions": [
    "How many of the two included minor revision rounds have already been used?",
    "Is the requested revision round within the scope of minor text, colour, and spacing changes described in S3?"
  ],
  "deliverables": [
    "Requested: one additional revision round"
  ]
}
```

## booking-button

```json
{
  "classification": "ambiguous",
  "summary": "Client requested adding a booking button. The agreement's Contact section includes only a simple email enquiry form and explicitly excludes appointment booking. A 'booking button' alone does not establish whether this is a link to an existing external booking service or new built-in booking functionality, so it cannot yet be classified.",
  "references": [
    "S5"
  ],
  "questions": [
    "Is the booking button simply a link to an existing external booking/scheduling service, or does it require new built-in appointment booking functionality on the site?"
  ],
  "deliverables": [
    "Add a booking button to the website"
  ]
}
```

## post-launch-form

```json
{
  "classification": "ambiguous",
  "summary": "Client reports the contact form is broken after launch. This could be a defect in the originally delivered form (not addressed by the agreement) or a request for ongoing maintenance, which is explicitly excluded. The evidence does not establish which applies.",
  "references": [
    "S5",
    "S6"
  ],
  "questions": [
    "Is the form malfunction a defect in the form as originally delivered, or did it break due to a change, update, or external factor after launch?",
    "Has the form ever worked correctly since deployment, or has it been broken since initial delivery?"
  ],
  "deliverables": [
    "Fix the contact enquiry form, which is reported as not working after launch."
  ]
}
```

## unlisted-blog

```json
{
  "classification": "ambiguous",
  "summary": "The client requests adding a blog page. The agreement specifies a five-page site (Home, About, Services, Portfolio, Contact) and requires clarification for anything not described in it. A blog page is not listed, but it is unclear whether it would replace one of the five agreed pages or be added as an extra page beyond that scope.",
  "references": [
    "S1",
    "S7"
  ],
  "questions": [
    "Should the blog page replace one of the five agreed pages (Home, About, Services, Portfolio, Contact), or is it an additional page beyond those five?"
  ],
  "deliverables": [
    "Add a blog page to the website."
  ]
}
```

## mixed-unknown-revision

```json
{
  "classification": "additional",
  "summary": "Client requests appointment booking with selectable time slots, which the agreement expressly excludes (S5). Client also requests another round of heading-colour revisions; S3 includes two minor revision rounds and excludes further rounds, but the client has not stated how many rounds have already been used, so this part remains unresolved pending clarification.",
  "references": [
    "S5",
    "S3"
  ],
  "questions": [
    "How many of the two included minor revision rounds have already been used?"
  ],
  "deliverables": [
    "Add appointment booking with available time slots"
  ]
}
```

For each answer record keep/edit/reject/unable to assess, citation support, missing facts, mixed-work separation, extra deliverables, invented authority or financial terms, and clarity. Keep your first-pass decisions and original outputs unchanged. Write corrections separately using the worksheet in HUMAN_SCOPE_REVIEW.md. Independent review is pending; no reviewer score or finding has been filled in.
