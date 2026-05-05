const fs = require('fs');
let content = fs.readFileSync('src/routes/ajuan.$id.tsx', 'utf8');

content = content.replace(
  'const element = document.getElementById("nota-document");',
  'const isAdministrasi = role === "administrasi";\n    const targetId = isAdministrasi ? "form-administrasi-document" : "nota-document";\n    const element = document.getElementById(targetId);'
);

content = content.replace(
  'const pdf = new jsPDF("p", "mm", "a5");',
  'const pdf = new jsPDF("p", "mm", isAdministrasi ? "a4" : "a5");'
);

content = content.replace(
  'pdf.save(`Nota_${safeKode}.pdf`);',
  'const filename = isAdministrasi ? `Form_Pencairan_${safeKode}.pdf` : `Nota_${safeKode}.pdf`;\n      pdf.save(filename);'
);

fs.writeFileSync('src/routes/ajuan.$id.tsx', content);
console.log("Patched successfully!");
