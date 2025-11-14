// --- Load file text ----------------------------------------------------------
const fileBuffer = $('Read .PAS Files from Disk').first().binary.data.data;
const buffer = Buffer.from(fileBuffer, 'base64');
const fileText = buffer.toString('utf8');
const lines = fileText.split(/\r?\n/);
const filename = $('Read .PAS Files from Disk').first().json.fileName;

// --- Input from the “Return Array of Line Numbers+Rows per Diff File” node ---
const numbers = $('Return Array of Line Numbers+Rows per Diff File')
  .first()
  .json.newLineNumbersOnly || [];

const diffInfo = $('Read Diff File').first();
const revision = diffInfo?.json?.revision;
const path = diffInfo?.json?.path;

// --- Find the `implementation` section (1-based line number) ----------------
let implementationLineNumber = null;
for (let i = 0; i < lines.length; i++) {
  if (/^\s*implementation\s*$/i.test(lines[i])) {
    implementationLineNumber = i + 1; // 1-based
    break;
  }
}

// --- Signature regex ---------------------------------------------------------
// Supports all these cases:
//   procedure Foo.Bar(Baz: Integer);
//   procedure Foo.Bar;
//   function Foo.Bar: Boolean;
//   function Foo.Bar(Baz: Integer): Boolean;
//   class procedure Foo.Bar(...);
//   class function Foo.Bar(...): Some.Type;
//   constructor Foo.Create(...);
//   destructor Foo.Destroy;

//const sigRegex = /^\s*(?:class\s+)?(procedure|function|constructor|destructor)\s+([A-Za-z_][\w\.]*)\s*(\([^;)]*\))?\s*(?::\s*[^;]+)?\s*;/i;

const sigRegex = /^\s*(?:class\s+)?(procedure|function|constructor|destructor)\s+([A-Za-z_][\w\.]*)\s*(\([^)]*\))?\s*(?::\s*[^;]+)?\s*;/i;

// --- Parse procedure/function blocks ONLY after `implementation` -------------
const procedures = [];
let currentProc = null;

for (let i = 0; i < lines.length; i++) {
  // Ignore anything before `implementation`
  if (implementationLineNumber && (i + 1) < implementationLineNumber) continue;

  const line = lines[i];
  const m = line.match(sigRegex);
  if (m) {
    // Close previous block
    if (currentProc) {
      currentProc.end = i; // end before this signature line
      procedures.push(currentProc);
    }
    currentProc = { name: m[2], start: i + 1 }; // 1-based
  }
}
// Close the final open block
if (currentProc) {
  currentProc.end = lines.length;
  procedures.push(currentProc);
}

// --- Helper: slice by 1-based inclusive start/end ----------------------------
function slice1Based(start1, end1) {
  const start0 = Math.max(0, start1 - 1);
  const end0Inclusive = Math.min(lines.length - 1, end1 - 1);
  return lines.slice(start0, end0Inclusive + 1).join('\n');
}

// --- Build results for each diff line ---------------------------------------
const results = numbers.map((data) => {
  const lineNumber = data.newLineNumber; // 1-based
  const affectedRows = data.affectedRows ?? Infinity;

  let procedureName = `Not_inside_a_procedure_Line_${lineNumber}_${filename}`;
  let procedureCode = '.N/A.nocode';

  // Case: before implementation section
  if (implementationLineNumber && lineNumber < implementationLineNumber) {
    procedureName = `Before_Implementation_Section_Line_${lineNumber}_${filename}`;
    procedureCode = '.N/A.nocode';
  } else {
    // Find enclosing procedure block
    for (let i = 0; i < procedures.length; i++) {
      const p = procedures[i];
      if (lineNumber >= p.start && lineNumber <= p.end) {
        procedureName = `${p.name}_Line_${lineNumber}_${filename}`;
        let blockStart = p.start;
        let blockEnd = p.end;
        let totalLines = blockEnd - blockStart + 1;

        // Optionally include the NEXT procedure if within affectedRows budget
        if (i + 1 < procedures.length && totalLines < affectedRows) {
          const next = procedures[i + 1];
          const nextLen = next.end - next.start + 1;
          if (totalLines + nextLen <= affectedRows) {
            procedureName += `;${next.name}_Line_${lineNumber}_${filename}`;
            blockEnd = next.end;
          }
        }

        procedureCode = slice1Based(blockStart, blockEnd);
        break;
      }
    }
  }

  return {
    json: {
      procedure: procedureName,
      procedureCode,
      lineNumber,
      affectedRows,
      revision,
      path,
    },
  };
});

return results;