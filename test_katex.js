const abstracts = [
    `We analyzed 17 outer Galaxy clouds and five inner Galaxy clouds with metallicities ranging from 0.38 Z$_{{\\ensuremath{\\odot}}}$ to 1.29 Z$_{{\\ensuremath{\\odot}}}$. The luminosity of HCN and HCO$^{+}$ J = 1 {\\textrightarrow} 0 lines are converted to a dense gas mass by the conversion factor, {\\ensuremath{\\alpha}}$_{Q}$.`,
    `We report a value of (129.9 {\\ensuremath{\\pm}} 5.8) meV and (14.9 {\\ensuremath{\\pm}} 0.8) meV, respectively.`
];

function cleanForDisplay(text) {
    if (!text) return '';
    let res = text.replace(/^\\{|\\}$/g, '');
    
    // 1. Remove \ensuremath{} wrapper
    res = res.replace(/\\ensuremath\{([^}]*)\}/g, '$1');
    
    // 2. Process text outside of math mode
    let parts = res.split('$');
    for (let i = 0; i < parts.length; i += 2) {
        let part = parts[i];
        
        // Wrap bare LaTeX math macros in $...$
        // This regex matches \command where command is letters only, and NOT starting with 'text'
        // Wait, \pm is matched here.
        part = part.replace(/(\\(?!text[a-zA-Z]+)[a-zA-Z]+)/g, '$$$1$$');
        
        // Text-mode commands -> unicode
        part = part
            .replace(/\\\\texttimes/g, '×')
            .replace(/\\\\textperiodcentered/g, '·')
            .replace(/\\\\textasciitilde/g, '~')
            .replace(/\\\\textrightarrow/g, '→')
            .replace(/\\\\textendash/g, '–')
            .replace(/\\\\raisebox\\{[^}]*\\}/g, '');
            
        // Clean braces outside math
        part = part.replace(/\\{|\\}/g, '');
        
        parts[i] = part;
    }
    res = parts.join('$');
    
    // 3. Fix adjacent $$ created by wrapping
    // This turns $...$$...$ into $......$
    res = res.replace(/\\$\\$/g, '');
    
    // Other cleanups
    res = res
        .replace(/\\\\&/g, '&')
        .replace(/─/g, '–')
        .replace(/\\s+/g, ' ')
        .trim();
        
    return res;
}

abstracts.forEach(a => {
    console.log("Original:", a);
    console.log("Cleaned:", cleanForDisplay(a));
});
