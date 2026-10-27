import jsPDF from "jspdf";

export interface ZoneLike {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface EventLike {
  id: string;
  title?: string;
  name?: string;
  zoneId?: string;
  category?: string;
  fees?: number | string;
  venue?: string;
  date?: string;
  [key: string]: any;
}

export interface TeamMemberLike {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  college?: string;
  year?: string;
}

export interface RegistrationLike {
  id: string;
  eventId: string;
  teamName?: string;
  leaderName?: string;
  leaderEmail?: string;
  leaderPhone?: string;
  leader?: {
    name?: string;
    email?: string;
    phone?: string;
    college?: string;
  };
  teamLeader?: {
    name?: string;
    email?: string;
    phone?: string;
    college?: string;
  };
  college?: string;
  members?: TeamMemberLike[];
  paymentSlip?: string;
  paymentProof?: string;
  paymentScreenshot?: string;
  utrNumber?: string;
  utr?: string;
  transactionId?: string;
  amount?: number | string;
  status?: string;
  timestamp?: string;
  registeredAt?: string;
  createdAt?: string;
  zone?: string;
  [key: string]: any;
}

export function getZoneLabel(zoneId?: string, zones?: ZoneLike[]): string {
  if (!zoneId) return "GENERAL TRACK";
  
  if (zones && zones.length > 0) {
    const found = zones.find((z) => z.id === zoneId);
    if (found) {
      const name = found.title || found.name || zoneId;
      return name.toUpperCase();
    }
  }

  const zid = zoneId.toLowerCase();
  if (zid.includes("code") || zid === "zone-a" || zid === "zone_a") {
    return "ZONE A: CODE-ZONE";
  }
  if (zid.includes("fun") || zid === "zone-b" || zid === "zone_b") {
    return "ZONE B: FUN-ZONE";
  }
  if (zid.includes("fin") || zid.includes("tech") || zid === "zone-c" || zid === "zone_c") {
    return "ZONE C: FIN-TECH";
  }
  return zoneId.toUpperCase();
}

function getLeaderInfo(reg: RegistrationLike) {
  const name = reg.leaderName || reg.leader?.name || reg.teamLeader?.name || "Team Leader";
  const email = reg.leaderEmail || reg.leader?.email || reg.teamLeader?.email || "N/A";
  const phone = reg.leaderPhone || reg.leader?.phone || reg.teamLeader?.phone || "N/A";
  const college = reg.college || reg.leader?.college || reg.teamLeader?.college || "N/A";
  return { name, email, phone, college };
}

function getImageFormat(dataUrl: string): "JPEG" | "PNG" | "WEBP" | null {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  if (dataUrl.startsWith("data:image/")) return "JPEG";
  return null;
}

/**
 * Generate a comprehensive single-team Dossier PDF with squad details and payment slip
 */
export async function generateTeamDossierPdf(
  reg: RegistrationLike,
  event?: EventLike,
  zones?: ZoneLike[],
  settings?: any
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 32, "F");

  // Accent Line
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 31, pageWidth, 2, "F");

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PLANET-X 2026 // OFFICIAL REGISTRATION DOSSIER", margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  const orgName = settings?.contactEmail ? `Host: ${settings.contactEmail}` : "SVKM Institute of Technology";
  doc.text(`${orgName} | Verification Portal`, margin, 21);
  doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, margin, 26);

  // Status Badge in header
  const status = (reg.status || "APPROVED").toUpperCase();
  doc.setFillColor(
    status === "APPROVED" || status === "VERIFIED" ? 16 : 245,
    status === "APPROVED" || status === "VERIFIED" ? 185 : 158,
    status === "APPROVED" || status === "VERIFIED" ? 129 : 11
  );
  doc.roundedRect(pageWidth - margin - 35, 10, 35, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(status, pageWidth - margin - 17.5, 16.5, { align: "center" });

  let y = 42;

  // Event & Zone Track Information Card
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, "FD");

  const zoneLabel = getZoneLabel(event?.zoneId || reg.zone, zones);
  const eventTitle = event?.title || event?.name || "Official Registered Event";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(`EVENT ALLOCATION: ${zoneLabel}`, margin + 5, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(eventTitle, margin + 5, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const regDate = reg.registeredAt || reg.timestamp || reg.createdAt || "N/A";
  doc.text(`Registration ID: ${reg.id}  |  Submitted: ${regDate}`, margin + 5, y + 23);

  y += 36;

  // Team & Leader Overview (2 Columns)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "FD");

  const leader = getLeaderInfo(reg);

  // Left Col: Team Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("DELEGATION / TEAM NAME", margin + 5, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(reg.teamName || "Direct Entry", margin + 5, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`College / Institute: ${leader.college}`, margin + 5, y + 24);

  // Right Col: Team Leader
  const col2X = margin + contentWidth / 2 + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("TEAM LEADER CONTACT", col2X, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(leader.name, col2X, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Email: ${leader.email}`, col2X, y + 22);
  doc.text(`Phone: ${leader.phone}`, col2X, y + 28);

  y += 40;

  // Squad / Team Members Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("REGISTERED SQUAD MEMBERS", margin, y);

  y += 4;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 7, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("#", margin + 3, y + 4.8);
  doc.text("MEMBER NAME", margin + 12, y + 4.8);
  doc.text("ROLE / DESIGNATION", margin + 65, y + 4.8);
  doc.text("EMAIL ADDRESS", margin + 105, y + 4.8);
  doc.text("PHONE / WHATSAPP", margin + 148, y + 4.8);

  y += 7;

  // Leader as #1
  const membersList: TeamMemberLike[] = [];
  membersList.push({
    name: `${leader.name} (Team Leader)`,
    email: leader.email,
    phone: leader.phone,
    role: "Team Leader",
    college: leader.college,
  });

  if (reg.members && Array.isArray(reg.members)) {
    reg.members.forEach((m) => {
      if (m && m.name && m.name.toLowerCase() !== leader.name.toLowerCase()) {
        membersList.push(m);
      }
    });
  }

  membersList.forEach((mem, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 6.5, "FD");

    doc.setFont("helvetica", idx === 0 ? "bold" : "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    doc.text(String(idx + 1), margin + 3, y + 4.5);
    doc.text(mem.name || "-", margin + 12, y + 4.5);
    doc.text(mem.role || (idx === 0 ? "Team Leader" : "Member"), margin + 65, y + 4.5);
    doc.text(mem.email || "-", margin + 105, y + 4.5);
    doc.text(mem.phone || "-", margin + 148, y + 4.5);

    y += 6.5;
  });

  y += 6;

  // Payment Slip & Verification Block
  const slipImage = reg.paymentSlip || reg.paymentProof || reg.paymentScreenshot;
  const utr = reg.utrNumber || reg.utr || reg.transactionId || "UTR-VERIFIED";

  // If remaining space < 95mm, add new page
  if (y + 80 > pageHeight - 20) {
    doc.addPage();
    y = 20;

    // Header mini banner on page 2
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 16, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 15, pageWidth, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const teamTitle = reg.teamName || "Direct Entry";
    doc.text(`PLANET-X 2026 // PAYMENT VERIFICATION PROOF - ${teamTitle}`, margin, 10);
    y = 24;
  }

  // Payment summary box
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(187, 247, 208); // green-200
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52); // green-800
  doc.text("PAYMENT VERIFICATION DETAILS", margin + 5, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`UTR / Ref ID: ${utr}`, margin + 5, y + 12);
  const amtText = reg.amount ? `Fee Amount: ₹${reg.amount}` : "Fee: Event Standard";
  doc.text(amtText, margin + 70, y + 12);
  doc.text(`Verification Status: ${status}`, margin + 130, y + 12);

  y += 24;

  // Payment Slip image rendering
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("ATTACHED OFFICIAL PAYMENT RECEIPT / SLIP", margin, y);

  y += 4;

  if (slipImage && typeof slipImage === "string" && slipImage.startsWith("data:image/")) {
    const fmt = getImageFormat(slipImage);
    if (fmt) {
      try {
        const imgBoxWidth = 85;
        const imgBoxHeight = 85;
        const imgX = margin + (contentWidth - imgBoxWidth) / 2;

        // Border frame
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(imgX - 3, y - 1, imgBoxWidth + 6, imgBoxHeight + 6, 2, 2, "FD");

        doc.addImage(slipImage, fmt, imgX, y, imgBoxWidth, imgBoxHeight, undefined, "FAST");
        y += imgBoxHeight + 10;
      } catch (err) {
        console.error("Failed to render payment slip image into PDF:", err);
        // Fallback info box
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
        doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(185, 28, 28);
        doc.text("Payment slip attached in record but binary image format cannot be directly rendered.", margin + 5, y + 8);
        doc.text(`Reference UTR: ${utr}`, margin + 5, y + 14);
        y += 26;
      }
    }
  } else {
    // No visual image uploaded or text UTR proof
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("Direct Transaction Verification. UTR Reference is recorded on file.", margin + 5, y + 10);
    doc.text(`Official UTR Reference: ${utr}`, margin + 5, y + 16);
    y += 28;
  }

  // Footer / Watermark
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const footerText = "PLANET-X 2026 // SVKM Institute of Technology // Official Event Administration System";
  doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: "center" });

  // Save the PDF
  const cleanTeamName = (reg.teamName || "Team").replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`PlanetX_Dossier_${cleanTeamName}_${reg.id}.pdf`);
}

/**
 * Generate a comprehensive Master Report compiling all registrations with event/zone and payment slips
 */
export async function generateAllRegistrationsMasterPdf(
  registrations: RegistrationLike[],
  events?: EventLike[],
  zones?: ZoneLike[],
  settings?: any
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Title / Cover Page Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 37, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("PLANET-X 2026 // MASTER REGISTRATION COMPENDIUM", margin, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text("Full Delegation Rosters, Event Tracks, and Payment Slips Archive", margin, 24);
  doc.text(`Total Registered Delegations: ${registrations.length}  |  Export Date: ${new Date().toLocaleString("en-IN")}`, margin, 31);

  let y = 48;

  // Summary Table of Registrations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("EXECUTIVE REGISTRATIONS SUMMARY", margin, y);

  y += 5;

  // Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 7, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("#", margin + 3, y + 4.8);
  doc.text("TEAM NAME", margin + 10, y + 4.8);
  doc.text("EVENT ALLOCATION", margin + 55, y + 4.8);
  doc.text("ZONE TRACK", margin + 105, y + 4.8);
  doc.text("LEADER & PHONE", margin + 145, y + 4.8);

  y += 7;

  registrations.forEach((reg, i) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    const matchedEvent = events?.find((e) => e.id === reg.eventId);
    const zoneName = getZoneLabel(matchedEvent?.zoneId || reg.zone, zones);
    const eventName = matchedEvent?.title || matchedEvent?.name || "Event Entry";
    const leader = getLeaderInfo(reg);
    const teamTitle = (reg.teamName || "Direct Entry").slice(0, 24);

    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 6, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    doc.text(String(i + 1), margin + 3, y + 4.2);
    doc.text(teamTitle || "-", margin + 10, y + 4.2);
    doc.text(eventName.slice(0, 26), margin + 55, y + 4.2);
    doc.text(zoneName.slice(0, 22), margin + 105, y + 4.2);
    doc.text(`${leader.name.slice(0, 16)} (${leader.phone})`, margin + 145, y + 4.2);

    y += 6;
  });

  // Now append a detailed page for each registration
  for (let idx = 0; idx < registrations.length; idx++) {
    const reg = registrations[idx];
    const matchedEvent = events?.find((e) => e.id === reg.eventId);
    const zoneLabel = getZoneLabel(matchedEvent?.zoneId || reg.zone, zones);
    const leader = getLeaderInfo(reg);
    const teamTitle = reg.teamName || "Direct Entry";

    doc.addPage();

    // Top Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 26, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 25, pageWidth, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`RECORD ${idx + 1} OF ${registrations.length}: ${teamTitle.toUpperCase()}`, margin, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(199, 210, 254);
    doc.text(`Track: ${zoneLabel} | Event: ${matchedEvent?.title || "N/A"} | ID: ${reg.id}`, margin, 19);

    let cy = 34;

    // Team Leader & College Block
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, cy, contentWidth, 26, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`Team Leader: ${leader.name}`, margin + 5, cy + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Email: ${leader.email}  |  Phone: ${leader.phone}`, margin + 5, cy + 13);
    doc.text(`College / Institute: ${leader.college}`, margin + 5, cy + 19);

    const utr = reg.utrNumber || reg.utr || reg.transactionId || "UTR-VERIFIED";
    doc.setFont("helvetica", "bold");
    doc.text(`Payment UTR: ${utr}`, margin + contentWidth / 2 + 5, cy + 13);

    cy += 32;

    // Members list
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("FULL SQUAD ROSTER", margin, cy);

    cy += 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cy, contentWidth, 6, "FD");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text("#", margin + 3, cy + 4.2);
    doc.text("NAME", margin + 12, cy + 4.2);
    doc.text("ROLE", margin + 65, cy + 4.2);
    doc.text("EMAIL", margin + 105, cy + 4.2);
    doc.text("PHONE", margin + 148, cy + 4.2);

    cy += 6;

    const squad: TeamMemberLike[] = [
      {
        name: `${leader.name} (Leader)`,
        role: "Team Leader",
        email: leader.email,
        phone: leader.phone,
      },
    ];

    if (reg.members && Array.isArray(reg.members)) {
      reg.members.forEach((m) => {
        if (m && m.name && m.name.toLowerCase() !== leader.name.toLowerCase()) {
          squad.push(m);
        }
      });
    }

    squad.forEach((mem, mIdx) => {
      doc.setFillColor(mIdx % 2 === 0 ? 255 : 248, mIdx % 2 === 0 ? 255 : 250, mIdx % 2 === 0 ? 255 : 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, cy, contentWidth, 5.5, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(String(mIdx + 1), margin + 3, cy + 3.8);
      doc.text(mem.name || "-", margin + 12, cy + 3.8);
      doc.text(mem.role || (mIdx === 0 ? "Leader" : "Member"), margin + 65, cy + 3.8);
      doc.text(mem.email || "-", margin + 105, cy + 3.8);
      doc.text(mem.phone || "-", margin + 148, cy + 3.8);

      cy += 5.5;
    });

    cy += 8;

    // Payment Slip Image
    const slip = reg.paymentSlip || reg.paymentProof || reg.paymentScreenshot;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("OFFICIAL PAYMENT SLIP ATTACHMENT", margin, cy);

    cy += 4;

    if (slip && typeof slip === "string" && slip.startsWith("data:image/")) {
      const fmt = getImageFormat(slip);
      if (fmt) {
        try {
          const imgSize = 75;
          const imgX = margin + (contentWidth - imgSize) / 2;

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(imgX - 3, cy - 1, imgSize + 6, imgSize + 6, 2, 2, "FD");

          doc.addImage(slip, fmt, imgX, cy, imgSize, imgSize, undefined, "FAST");
          cy += imgSize + 6;
        } catch (err) {
          console.error("Master PDF: Failed to embed slip image:", err);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(150, 50, 50);
          doc.text(`[Image attachment present in database - UTR: ${utr}]`, margin + 5, cy + 6);
          cy += 14;
        }
      }
    } else {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, cy, contentWidth, 16, 2, 2, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Direct Payment Entry - Transaction Reference: ${utr}`, margin + 5, cy + 10);
      cy += 20;
    }

    // Page footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`PLANET-X 2026 // Registration Verification Record // Page ${idx + 2}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }

  doc.save(`PlanetX_2026_Master_Registrations_Compendium_${new Date().toISOString().slice(0, 10)}.pdf`);
}
