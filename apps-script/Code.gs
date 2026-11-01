/**
 * Yuzu website enquiries: Google Apps Script web app.
 *
 * Standalone script owned by lanson@yuzutalent.com. It writes to the
 * "Yuzu Website Enquiries" Google Sheet (SHEET_ID below).
 * The Cloudflare Pages Function (functions/api/enquiries.js) POSTs each
 * validated enquiry here. This script appends a row to the Sheet and emails
 * NOTIFY_TO, with Reply-To set to the person who wrote in.
 *
 * Deploy: Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.
 * SECRET is stored in Project Settings > Script properties as ENQUIRY_SECRET,
 * and must match ENQUIRY_WEBHOOK_SECRET in Cloudflare.
 */
const SHEET_ID = "1XU2XDgOP14LN7KElOIw8ouOQUXkDrNEly5rBLis_3_M"; // "Yuzu Website Enquiries"
const NOTIFY_TO = "hello@yuzutalent.com"; // Group: everyone in it gets each enquiry
const SHEET_NAME = "Enquiries";
const HEADERS = ["Received", "Type", "Name", "Email", "Handle", "Company", "Budget", "Message", "Status", "Owner", "Country", "Site", "ID"];

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const secret = PropertiesService.getScriptProperties().getProperty("ENQUIRY_SECRET");
    if (!secret || data.secret !== secret) return reply({ ok: false, error: "unauthorized" });

    const sheet = getSheet();
    sheet.appendRow([
      data.receivedAt ? new Date(data.receivedAt) : new Date(),
      data.type || "", data.name || "", data.email || "", data.handle || "",
      data.company || "", data.budget || "", data.message || "",
      "New", "", data.country || "", data.site || "", data.id || ""
    ]);

    const label = data.type === "brand" ? "Brand" : data.type === "press" ? "Press" : "Creator";
    const who = data.type === "brand" ? (data.company || data.name) : (data.handle || data.name);
    const lines = [
      "New " + label.toLowerCase() + " enquiry from yuzutalent.com",
      "",
      "Name: " + data.name,
      "Email: " + data.email,
      data.handle ? "Handle: " + data.handle : "",
      data.company ? "Company: " + data.company : "",
      data.budget ? "Budget: " + data.budget : "",
      "",
      data.message,
      "",
      "Reply to this email to answer them directly.",
      "All enquiries: " + SpreadsheetApp.openById(SHEET_ID).getUrl()
    ].filter(function (l, i, a) { return l !== "" || a[i - 1] !== ""; });

    MailApp.sendEmail({
      to: NOTIFY_TO,
      replyTo: data.email,
      name: "Yuzu website",
      subject: "[Enquiry · " + label + "] " + who,
      body: lines.join("\n")
    });
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err && err.message || err) });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
