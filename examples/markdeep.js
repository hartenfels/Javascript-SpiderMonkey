/**
  markdeep.js
  Based on version 0.06, altered by Carsten Hartenfels.

  Copyright 2015, Morgan McGuire, http://casual-effects.com
  All rights reserved.

  -------------------------------------------------------------

  See http://casual-effects.com/markdeep for documentation on how to
  use this script make your plain text documents render beautifully
  in web browsers.

  Markdeep was created by Morgan McGuire. It extends the work of:

   - John Gruber's original Markdown
   - Ben Hollis' Maruku Markdown dialect
   - Michel Fortin's Markdown Extras dialect
   - Ivan Sagalaev's highlight.js
   - Contributors to the above open source projects

  -------------------------------------------------------------
 
  You may use, extend, and redistribute this code under the terms of
  the BSD license at https://opensource.org/licenses/BSD-2-Clause.

  and highlight.js(https://github.com/isagalaev/highlight.js) by Ivan
  Sagalaev, which is used for code highlighting. Each has their
  respective license with them.
*/
/**
 See http://casual-effects.com/markdeep for @license and documentation.

 markdeep.min.js version 0.05
 Copyright 2015, Morgan McGuire 
 All rights reserved.
 (BSD 2-clause license)
*/
(function() {
'use strict';

// For minification. This is admittedly scary.
var _ = String.prototype;
_.rp = _.replace;
_.ss = _.substring;

/** Enable for debugging to view character bounds in diagrams */
var DEBUG_SHOW_GRID = false;

/** Overlay the non-empty characters of the original source in diagrams */
var DEBUG_SHOW_SOURCE = DEBUG_SHOW_GRID;

/** Use to suppress passing through text in diagrams */
var DEBUG_HIDE_PASSTHROUGH = DEBUG_SHOW_SOURCE;

/** In pixels of lines in diagrams */
var STROKE_WIDTH = 2;

/** A box of these denotes a diagram */
var DIAGRAM_MARKER = '*';

// http://stackoverflow.com/questions/1877475/repeat-character-n-times
var DIAGRAM_START = Array(5 + 1).join(DIAGRAM_MARKER);

function entag(tag, content) {
    return '<' + tag + '>' + content + '</' + tag + '>';
}

var BODY_STYLESHEET = entag('style', 'body { max-width: 680px;' +
    'margin:auto;' +
    'padding:20px;' +
    'text-align:justify;' +
    'line-height:139%; ' +
    'color:#222;' +
    'font-family: Palatino,Georgia,"Times New Roman",serif;}');

/** You can embed your own stylesheet AFTER the <script> tags in your
    file to override these defaults. */
var STYLESHEET = entag('style',
    'body{' +
    'counter-reset: h1 h2 h3 h4 h5 h6;' +
    '}' +

    '.md div.title{' +
    'font-size:26px;' +
    'font-weight:800;' +
    'padding-bottom:0px;' +
    'line-height:120%;' +
    'text-align:center;' +
    '}' +

    '.md div.afterTitles{height:0px;}' +

    '.md div.subtitle{' +
    'text-align:center;' +
    '}' +

    '.md div.title, h1, h2, h3, h4, h5, h6, .md .shortTOC, .md .longTOC {' +
    'font-family:Verdana,Helvetica,Arial,sans-serif;' +
    '}' +

    '.md svg.diagram{' +
    'display:block;' +
    'font-family:Menlo,\'Lucida Console\',monospace;'+ 
    'font-size:12px;' +
    'text-align:center;' +
    'stroke-linecap:round;' +
    'stroke-width:' + STROKE_WIDTH + 'px;'+
    '}' +

    'h1{' +
    'padding-bottom:3px;' +
    'padding-top:15px;' +
    'border-bottom:3px solid;' +
    'border-top:none;' +
    'font-size:20px;' +
    'counter-reset: h2 h3 h4 h5 h6;' +
    'clear:both;' +
    '}' +

    'h2{' +
    'counter-reset: h3 h4 h5 h6;' +
    'font-family:Helvetica,Arial,sans-serif;' +
    'padding-bottom:3px;' +
    'padding-top:15px;' +
    'border-bottom:2px solid #999;' +
    'border-top:none;' +
    'color:#555;' +
    'font-size:18px;' +
    'clear:both;' +
    '}' +

    'h3, h4, h5, h6{' +
    'font-family:Helvetica,Arial,sans-serif;' +
    'padding-bottom:3px;' +
    'padding-top:15px;' +
    'border-top:none;' +
    'color:#555;' +
    'font-size:16px;' +
    'clear:both;' +
    '}' +

    'h3{counter-reset: h4 h5 h6;}' +
    'h4{counter-reset: h5 h6;}' +
    'h5{counter-reset: h6;}' +

    '.md table{' +
    'margin:auto;' +
    'border-collapse:collapse;' +
    '}' +

    '.md th{' +
    'color:#FFF;' +
    'background-color:#AAA;' +
    'border:1px solid #888;' +
     // top right bottom left
    'padding:8px 15px 8px 15px;' +
    '}' +

    '.md td{' +
     // top right bottom left
    'padding:5px 15px 5px 15px;' +
    'border:1px solid #888;' +
    '}' +

    '.md tr:nth-child(even){'+
    'background:#EEE;' +
    '}' +

    '.md a:link, .md a:visited{color:#38A;text-decoration:none;}' +
    '.md a:hover{text-decoration:underline}' +

    '.md dt{' +
    'font-weight:700;' +
    '}' +

    '.md dd{' +
    'padding-bottom:18px;' +
    '}' +

    '.md code{' +
    'white-space:pre;' +
    '}' +

    '.markdeepFooter{font-size:9px;text-align:right;padding-top:80px;color:#999;}' +

    '.md .longTOC{float:right;font-size:12px;line-height:15px;border-left:1px solid #CCC;padding-left:15px;margin:15px 0px 15px 25px;}' +
     
    '.md .shortTOC{text-align:center;font-weight:bold;margin-top:15px;font-size:14px;}');

var MARKDEEP_LINE = '<!-- Markdeep: --><style class="fallback">body{white-space:pre;font-family:monospace}</style><script src="markdeep.min.js"></script><script src="http://casual-effects.com/markdeep/latest/markdeep.min.js"></script>';

var MARKDEEP_FOOTER = '<div class="markdeepFooter"><i>formatted by <a href="http://casual-effects.com/markdeep" style="color:#999">Markdeep&nbsp;&nbsp;&nbsp;</a></i><div style="display:inline-block;font-size:13px;font-family:\'Times New Roman\',serif;vertical-align:middle;transform:translate(-3px,-1px)rotate(135deg);">&#x2712;</div></div>';

var DEFAULT_OPTIONS = {
    mode: 'markdeep',
    detectMath: true
};

var max = Math.max;
var min = Math.min;

/** Get an option, or return the corresponding value from DEFAULT_OPTIONS */
function option(key) {
    if (window.markdeepOptions && (window.markdeepOptions[key] !== undefined)) {
        return window.markdeepOptions[key];
    } else if (DEFAULT_OPTIONS[key] !== undefined) {
        return DEFAULT_OPTIONS[key];
    } else {
        console.warn('Illegal option: "' + key + '"');
        return undefined;
    }
}

/** Converts <>&" to their HTML escape sequences */
function escapeHTMLEntities(str) {
    return String(str).rp(/&/g, '&amp;').rp(/</g, '&lt;').rp(/>/g, '&gt;').rp(/"/g, '&quot;');
}

/** Restores the original source string's '<' and '>' as entered in
    the document, before the browser processed it as HTML. There is no
    way in an HTML document to distinguish an entity that was entered
    as an entity.
*/
function unescapeHTMLEntities(str) {
    // Process &amp; last so that we don't recursively unescape
    // escaped escape sequences.
    return str.
        rp(/&lt;/g, '<').
        rp(/&gt;/g, '>').
        rp(/&quot;/g, '"').
        rp(/&#39;/g, "'").
        rp(/&ndash;/g, '--').
        rp(/&mdash;/g, '---').
        rp(/&amp;/g, '&');
}



/** Turn the argument into a legal URL anchor */
function mangle(text) {
    return encodeURI(text.rp(/\s/g, '').toLowerCase());
}

/** Creates a style sheet containing elements like:

  hn::before { 
    content: counter(h1) "." counter(h2) "." ... counter(hn) " "; 
    counter-increment: hn; 
   } 
*/
function sectionNumberingStylesheet() {
    var s = '';

    for (var i = 1; i <= 6; ++i) {
        s += 'h' + i + '::before {\ncontent:';
        for (var j = 1; j <= i; ++j) {
            s += 'counter(h' + j + ') "' + ((j < i) ? '.' : ' ') + '" ';
        }
        s += ';\ncounter-increment: h' + i + ';}';
    }

    return entag('style', s);
}

/**
   \param node  A node from an HTML DOM

   \return A String that is a very good reconstruction of what the
   original source looked like before the browser tried to correct
   it to legal HTML.
 */
function nodeToMarkdeep(node, leaveEscapes) {
    var source = node.innerHTML;

    // Markdown uses <john@bar.com> e-mail syntax, which HTML parsing
    // will try to close by inserting the matching close tags at the end of the
    // document. Remove anything that looks like that and comes *after*
    // the first fallback style.
    source = source.rp(/(?:<style class="fallback">[\s\S]*?<\/style>[\s\S]*)<\/\S+@\S+\.\S+?>/gim, '');
    
    // Remove artificially inserted close tags
    source = source.rp(/<\/h?ttps?:.*>/gi, '');
    
    // Now try to fix the URLs themselves, which will be 
    // transformed like this: <http: casual-effects.com="" markdeep="">
    source = source.rp(/<(https?): (.*?)>/gi, function (match, protocol, list) {

        // Remove any quotes--they wouldn't have been legal in the URL
        var s = '<' + protocol + '://' + list.rp(/=""\s/g, '/');

        if (s.ss(s.length - 3) === '=""') {
            s = s.ss(0, s.length - 3);
        }

        // Remove any lingering quotes (since they
        // wouldn't have been legal in the URL)
        s = s.rp(/"/g, '');

        return s + '>';
    });

    // Remove the "fallback" style tags
    source = source.rp(/<style class=["']fallback["']>.*?<\/style>/gmi, '');

    source = unescapeHTMLEntities(source);

    return source;
}


/** Extracts one diagram from a Markdown string.

    Returns {beforeString, diagramString, alignmentHint, afterString}
    diagramString will be empty if nothing was found. The
    DIAGRAM_MARKER is stripped from the diagramString. */
function extractDiagram(sourceString) {

    var noDiagramResult = {beforeString: sourceString, diagramString: '', alignmentHint: '', afterString: ''};

    // Search sourceString for the first rectangle of enclosed
    // DIAGRAM_MARKER characters at least DIAGRAM_START.length wide
    for (var i = sourceString.indexOf(DIAGRAM_START);
         i >= 0; 
         i = sourceString.indexOf(DIAGRAM_START, i + DIAGRAM_START.length)) {

        // Is this a diagram? Try following it around
        
        // Look backwards to find the beginning of the line (or of the string)
        // and measure the start character relative to it
        var lineBeginning = max(0, sourceString.lastIndexOf('\n', i)) + 1;
        var xMin = i - lineBeginning;
        
        // Find the first non-diagram character...or the end of the string
        var j;
        for (j = i + DIAGRAM_START.length; sourceString[j] === DIAGRAM_MARKER; ++j) {}
        var xMax = j - lineBeginning - 1;
        
        // We have a potential hit. Start accumulating a result. If there was anything
        // between the newline and the diagram, move it to the after string for proper alignment.
        var result = {
            beforeString: sourceString.ss(0, lineBeginning), 
            diagramString: '',
            alignmentHint: '', 
            afterString: sourceString.ss(lineBeginning, i).rp(/[ \t]*[ \t]$/, ' ')
        };

        var nextLineBeginning = 0;
        var textOnLeft = false, textOnRight = false;

        var advance = function() {
            nextLineBeginning = sourceString.indexOf('\n', lineBeginning) + 1;
            textOnLeft  = textOnLeft  || /\S/.test(sourceString.ss(lineBeginning, lineBeginning + xMin));
            textOnRight = textOnRight || /\S/.test(sourceString.ss(lineBeginning + xMax + 1, nextLineBeginning));
        }

        advance();
                                    
        // Now, see if the pattern repeats on subsequent lines
        for (var good = true, previousEnding = j; good; ) {
            // Find the next line
            lineBeginning = nextLineBeginning;
            advance();
            if (lineBeginning === 0) {
                // Hit the end of the string before the end of the pattern
                return noDiagramResult; 
            }
            
            if (textOnLeft) {
                // Even if there is text on *both* sides
                result.alignmentHint = 'right';
            } else if (textOnRight) {
                result.alignmentHint = 'left';
            }
            
            // See if there are markers at the correct locations on the next line
            if ((sourceString[lineBeginning + xMin] === DIAGRAM_MARKER) && 
                (sourceString[lineBeginning + xMax] === DIAGRAM_MARKER)) {

                // See if there's a complete line of DIAGRAM_MARKER, which would end the diagram
                for (var x = xMin; (x < xMax) && (sourceString[lineBeginning + x] === DIAGRAM_MARKER); ++x) {}
           
                var begin = lineBeginning + xMin;
                var end   = lineBeginning + xMax;

                // Trim any excess whitespace caused by our truncation because Markdown will
                // interpret that as fixed-formatted lines
                result.afterString += sourceString.ss(previousEnding, begin).rp(/^[ \t]*[ \t]/, ' ').rp(/[ \t][ \t]*$/, ' ');
                if (x === xMax) {
                    // We found the last row. Put everything else into
                    // the afterString and return the result.
                
                    result.afterString += sourceString.ss(lineBeginning + xMax + 1);
                    return result;
                } else {
                    // A line of a diagram. Extract everything before
                    // the diagram line started into the string of
                    // content to be placed after the diagram in the
                    // final HTML
                    result.diagramString += sourceString.ss(begin + 1, end) + '\n';
                    previousEnding = end + 1;
                }
            } else {
                // Found an incorrectly delimited line. Abort
                // processing of this potential diagram, which is now
                // known to NOT be a diagram after all.
                good = false;
            }
        } // Iterate over verticals in the potential box
    } // Search for the start

    return noDiagramResult;
}

/** 
    Find the specified delimiterRegExp used as a quote (e.g., *foo*)
    and rp it with the HTML tag and optional cssClass
*/
function replaceMatched(string, delimiterRegExp, tag, cssClass) {
    // Intentionally includes double delimiters for two-
    // character sequences; the second will naturally be
    // ignored.
    var flanking = '[^ \\t\n' + delimiterRegExp.source + ']';
    var pattern  = '(' + delimiterRegExp.source + ')' +
        '(' + flanking + '(?:.*?' + flanking + ')?)' + 
        '(' + delimiterRegExp.source + ')(?![A-Za-z0-9])';

    return string.rp(new RegExp(pattern, 'g'), 
                          '<' + tag + (cssClass ? ' class="' + cssClass + '"' : '') + 
                          '>$2</' + tag + '>');
}
    

/** 
    Invokes fcn for each block of str that is not inside of a PRE or
    SVG tag, and then concatenates the results. 
    
    Test: 
     mapTextBlock("1234<svg>abcd</svg>5678", function (x) { return '[' + x + ']'; })
*/
function mapTextBlock(source, fcn, excludedTags) {
    
    // Case insensitive search for this regular expression of tags
    // that we don't go inside during search
    var tags = excludedTags || /<pre(\s.*?)?>|<code(\s.*?)?>|<svg(\s.*?)?>|<script\s.*?>|<style\s.*?>|<protect>/i;

    var dest = '';
    while (source.length > 0) {
        var i = source.search(tags);
        if (i === -1) {
            // This is the last block...process the whole thing
            dest += fcn(source);
            source = '';
        } else {
            // Split the string here at this HTML tag and process the
            // previous chunk
            dest += fcn(source.ss(0, i));

            // Find the name of this tag
            var whitespaceIndex = max(source.ss(i + 1, i + 15).search(/[\s>]/), 0);
            var tag = source.ss(i + 1, i + whitespaceIndex + 1);
 
            // Jump to the end of the matching close tag
            var closeTag = new RegExp('</' + tag + '>', 'i');
            var end = source.search(closeTag);

            if (end === -1) { 
                // This tag never ends!
                end = source.length; 
            } else {
                // Skip over the tag
                end += tag.length + 3;
            }
            // Copy the tag body
            dest += source.ss(i, end);

            // Restart after the tag
            source = source.ss(end);
        }
    }

    return dest;
}


/** Maruku ("github")-style table processing */
function replaceTables(s) {
    var TABLE_ROW       = /(?:\n\|?[ \t\S]+?(?:\|[ \t\S]+?)+\|?(?=\n))/.source;
    var TABLE_SEPARATOR = /\n\|? *\:?-+\:?(?: *\| *\:?-+\:?)+ *\|?(?=\n)/.source;
    var TABLE_REGEXP    = new RegExp(TABLE_ROW + TABLE_SEPARATOR + TABLE_ROW + '+', 'g');
    
    function trimTableRowEnds(row) {
        return row.trim().rp(/^\||\|$/g, '');
    }
    
    s = s.rp(TABLE_REGEXP, function (match) {
        // Found a table, actually parse it by rows
        var rowArray = match.split('\n');
        
        var result = '';
        
        // Skip the bogus leading row
        var startRow = (rowArray[0] === '') ? 1 : 0;
        
        // Parse the separator row for left/center/right-indicating colons
        var columnStyle = [];
        trimTableRowEnds(rowArray[startRow + 1]).rp(/:?-+:?/g, function (match) {
            var left = (match[0] === ':');
            var right = (match[match.length - 1] === ':');
            columnStyle.push(' style="text-align:' + ((left && right) ? 'center' : (right ? 'right' : 'left')) + '"');
        });
        
        var tag = 'th';
        for (var r = startRow; r < rowArray.length; ++r) {
            // Remove leading and trailing whitespace and column delimiters
            var row = trimTableRowEnds(rowArray[r].trim());
            
            result += '<tr>';
            var i = 0;
            result += '<' + tag + columnStyle[0] + '>' + 
                row.rp(/\|/g, function () {
                    ++i;
                    return '</' + tag + '><' + tag + columnStyle[i] + '>';
                }) + '</' + tag + '>';
            
            
            result += '</tr>\n';
            // Skip the header-separator row
            if (r == startRow) { 
                ++r; 
                tag = 'td';
            }
        }
        
        return entag('table', result);
    });

    return s;
}

function replaceLists(s) {
    // Identify list blocks:
    // Blank line, line that starts with 1. or -,
    // and then any number of lines until another blank line
    var BLANK_LINE = /(?:^|\n)\s*\n/.source;
    var LIST_BLOCK_REGEXP = new RegExp('(?:' + BLANK_LINE + ')' +
                                       /([ \t]*(?:\d+\.|-|\+|\*)[ \t]+[\s\S]*?)/.source + 
                                       '(?=' + BLANK_LINE + ')', 'g');

    s = s.rp(LIST_BLOCK_REGEXP, function (match, block) {
        var result = '';

        // Contains {indentLevel, tag}
        var stack = [];
        var current = {indentLevel: -1};
        
        /* function logStack(stack) {
            var s = '[';
            stack.forEach(function(v) { s += v.indentLevel + ', '; });
            console.log(s.ss(0, s.length - 2) + ']');
        } */
        
        block.split('\n').forEach(function (line) {
            var trimmed     = line.rp(/^\s*/, '');

            var indentLevel = line.length - trimmed.length;

            var isUnordered = (trimmed[0] === '-') || (trimmed[0] === '+') || (trimmed[0] === '*');
            var isOrdered   = /^\d+\.[ \t]/.test(trimmed);

            if (! isOrdered  && ! isUnordered) {
                // Continued line
                result += '\n' + current.indentChars + line;
            } else {
                if (indentLevel !== current.indentLevel) {
                    // Enter or leave indentation level
                    if ((current.indentLevel !== -1) && (indentLevel < current.indentLevel)) {
                        while ((current !== undefined) && (indentLevel < current.indentLevel)) {
                            stack.pop();
                            // End the current list and decrease indentation
                            result += '</li></' + current.tag + '>';
                            current = stack[stack.length - 1];
                        }
                    } else {
                        // Start a new list that is more indented
                        current = {indentLevel: indentLevel,
                                   tag:         isOrdered ? 'ol' : 'ul',
                                   indentChars: line.ss(0, indentLevel)};
                        stack.push(current);
                        result += '<' + current.tag + '>';
                    }
                } else if (current.indentLevel !== -1) {
                    // End previous list item, if there was one
                    result += '</li>';
                } // Indent level changed

                if (current !== undefined) {
                    // Add the list item
                    result += '\n' + current.indentChars + '<li>' + trimmed.rp(/^(\d+\.|-|\+|\*) /, '');
                }
            }
        }); // For each line

        // Finish the last item and anything else on the stack
        for (current = stack.pop(); current !== undefined; current = stack.pop()) {
            result += '</li></' + current.tag + '>';
        }
       
        return result;
    });

    return s;
}


/**
 Term
 :     description, which might be multiple 
       lines and include blanks.

 Next Term

becomes

<dl>
  <dt>Term</dt>
  <dd> description, which might be multiple 
       lines and include blanks.</dd>
  <dt>Next Term</dt>
</dl>
*/
function replaceDefinitionLists(s) {
    // Find: beginning of line, term, colon, definition, 
    // optional one blank line ... repeated
    var BLANK_LINE = /(^[ \t]*\n)/.source;
    var TERM       = /^\w.*\n:/.source;

    // At least one space, any number of characters, and a newline repeated one or more
    // times.
    //
    // Followed by an optional blank line. Repeat the whole process
    // many times.
    var DEFINITION = '(([ \t].+\n)+' + BLANK_LINE + '?)+';

    s = s.rp(new RegExp('(' + TERM + DEFINITION + ')+', 'gm'),
             function (block) {
                 // Parse the block
                 var result = '';
                 
                 block.split('\n').forEach(function (line, i) {
                     // What kind of line is this?
                     if (line.trim().length === 0) {
                         // Empty line
                         result += '\n';
                     } else if (! /\s/.test(line[0]) && (line[0] !== ':')) {
                         // Definition
                         if (i > 0) { result += '</dd>\n'; }
                         result += '<dt>' + line + '</dt>\n<dd>';
                     } else {
                         // Add the line to the current definition, stripping any leading ':'
                         if (line[0] === ':') { line = line.ss(1); }
                         result += line + '\n';
                     }
                 });

                 return entag('dl', result + '</dd>');
             });

    return s;
}


function insertTableOfContents(s) {
    // Gather headers for table of contents (TOC). We
    // accumulate a long and short TOC and then choose which
    // to insert at the end.
    var longTOC = '';
    var shortTOC = '';
    
    // headerCounter[i] is the current counter for header level (i - 1)
    var headerCounter = [0];
    var currentLevel = 0;
    var numAboveLevel1 = 0;
    s = s.rp(/<h([1-6])>(.*)<\/h\1>/g, function (header, level, text) {
        level = parseInt(level)
        text = text.trim();
        // If becoming more nested:
        for (var i = currentLevel; i < level; ++i) { headerCounter[i] = 0; }
        
        // If becoming less nested:
        headerCounter.splice(level, currentLevel - level);
        currentLevel = level;
        
        ++headerCounter[currentLevel - 1];
        
        // Generate a unique name for this element
        var number = headerCounter.join('.');
        var name = 'toc' + number;

        // Only insert for the first three levels
        if (level <= 3) {
            // Indent and append
            longTOC += Array(level).join('&nbsp;&nbsp;') + '<a href="#' + name + '">' + number + '&nbsp; ' + text + '</a><br/>\n';
            
            if (level === 1) {
                shortTOC += ' &middot; <a href="#' + name + '">' + text + '</a>';
            } else {
                ++numAboveLevel1;
            }
        }
        
        return '<a name="' + name + '"></a>' + header;
    });

    if (shortTOC.length > 0) {
        // Strip the leading " &middot; "
        shortTOC = shortTOC.ss(10);
    }
    
    var numLevel1 = headerCounter[0];
    var numHeaders = numLevel1 + numAboveLevel1;

    // Which TOC should we use?
    var TOC = '';
    if (((numHeaders < 4) && (numLevel1 <= 1)) || (s.length < 2048)) {
        // No TOC; this document is really short
    } else if ((numLevel1 < 7) && (numHeaders / numLevel1 < 2.5)) {
        // We can use the short TOC
        TOC = '<div class="shortTOC">' + shortTOC + '</div>';
    } else {
        // Insert the long TOC
        TOC = '<div class="longTOC"><center><b>Contents</b></center><p>' + longTOC + '</p></div>';
    }

    // Try to insert after the title; if that isn't found, then insert at the top
    var inserted = false;
    s = s.rp(/<div class="afterTitles"><\/div>/, function (match) {
        inserted = true;
        return match + TOC;
    });

    if (! inserted) {
        s = TOC + s;
    }

    return s;
}

/**
    Performs Markdeep processing on str, which must be a string or a
    DOM element.  Returns a string that is the HTML to display for the
    body. The result does not include the header: Markdeep stylesheet
    and script tags for including a math library, or the Markdeep
    signature footer.

    Optional argument elementMode defaults to true. This avoids turning a bold first word into a title or introducing a table of contents. Section captions are unaffected by this argument.
    Set elementMode = false if processing a whole document instead of an internal node.

 */
function markdeepToHTML(str, elementMode) {
    if (elementMode === undefined) { 
        elementMode = true;
    }
    
    if (str.innerHTML !== undefined) {
        str = str.innerHTML;
    }

    function replaceDiagrams(str) {
        var result = extractDiagram(str);
        if (result.diagramString) {
            return result.beforeString + 
                diagramToSVG(result.diagramString, result.alignmentHint) + 
                replaceDiagrams(result.afterString);
        } else {
            return str;
        }
    }

    if (! elementMode) {
        var TITLE_PATTERN = /^\*\*([^ \t\*].*?[^ \t\*])\*\*[ \t]*\n/.source;
        
        var ALL_SUBTITLES_PATTERN = /([ {4,}\t][ \t]*\S.*\n)*/.source;
        
        // Detect a bold first line and make it into a title; detect indented lines
        // below it and make them subtitles
        str = str.rp(
            new RegExp(TITLE_PATTERN + ALL_SUBTITLES_PATTERN, 'g'),
            function (match, title) {
                title = title.trim();

                // rp + RegExp won't give us the
                // full list of subtitles, only the last
                // one. So, we have to re-process match.
                var subtitles = match.ss(match.indexOf('\n'));
                subtitles = subtitles ? subtitles.rp(/[ \t]*(\S.*?)\n/g, '<div class="subtitle">$1</div>\n') : '';
                
                return entag('title', title) + '<div class="title">' + title + 
                    '</div>\n' + subtitles + '<div class="afterTitles"></div>\n';
            });
    } // if ! noTitles

    str = replaceDiagrams(str);

    // Code fences in two different syntaxes. Do this before other
    // processing so that their code is protected from further
    // Markdown processing and so that it can't be broken by
    // mapTextBlock encountering a protected tag *inside* of a code
    // fence.
    [/\n~{3,}.*\n([\s\S]+?)\n~{3,}\n/gm,
     /\n`{3,}.*\n([\s\S]+?)\n`{3,}\n/gm].forEach(function (pattern) {
         str = str.rp(pattern, function(match, sourceCode) {
             // Old code for running without hljs:
             //return '<pre><code>' + escapeHTMLEntities(sourceCode) + '</code></pre>';

             // hljs version:
             return '\n' + entag('pre', entag('code', hljs.highlightAuto(sourceCode).value)) + '\n';
         });
     });

    // Temporarily hide MathJax LaTeX blocks from Markdown processing
    str = str.rp(/(\$\$[\s\S]+?\$\$)/gm, '<protect>$1</protect>');

  
    str = mapTextBlock(str, function (s) {

        // INLINE CODE: Surrounded in back ticks.  Do this before any
        // other processing to protect code blocks from further
        // interference. Don't process back ticks inside of code
        // fences.
        s = mapTextBlock(s, function (s) {
            return s.rp(/(`)(.+?)(`)/g, entag('code', '$2'));
        });

        // Escape angle brackets inside code blocks
        s = s.rp(/<code>(.*?)<\/code>/g, function (match, inlineCode) {
            return entag('code', escapeHTMLEntities(inlineCode));
        });

        s = mapTextBlock(s, function (s) {
            // Convert LaTeX $ ... $ to MathJax, but verify that this
            // actually looks like math and not just dollar
            // signs. Don't rp double-dollar signs. Do this only
            // outside of protected blocks.
            //
            // Literally: find a non-dollar sign, non-number followed
            // by a dollar sign and a space.  Then, find any number of
            // characters until the same pattern reversed. We're
            // trying to exclude things like Canadian 1$ and US $1
            // triggering math mode.
            s = s.rp(/([^\$\d\.])\$[ \t](.*?[^\$])\$([^\$\d\.])/g, '$1\\($2\\)$3');

            function makeHeaderFunc(level) {
                return function (match, header) {
                    return '\n<a name="' + mangle(header) + '"></a>' + entag('h' + level, header) + '\n\n';
                }
            }

            // Setext-style H1: Text with ======== right under it
            s = s.rp(/(?:^|\n)(.+?)\n={5,}[ \t]*\n/g, makeHeaderFunc(1));
            
            // Setext-style H2: Text with -------- right under it
            s = s.rp(/(?:^|\n)(.+?)\n-{5,}[ \t]*\n/g, makeHeaderFunc(2));

            // ATX-style headers:
            for (var i = 6; i > 0; --i) {
                s = s.rp(new RegExp(/^[ \t]*/.source + '#{' + i + ',' + i +'}[ \t]([^\n#]+)#*[ \t]*\n', 'gm'), 
                         makeHeaderFunc(i));
            }

            // HORIZONTAL RULE: * * *, - - -, _ _ _
            s = s.rp(/\n((?:_[ \t]*){3,}|(?:-[ \t]*){3,}|(?:\*[ \t]*){3,})\s*?\n/g, '\n<hr/>\n');

            // BLOCKQUOTE: > in front of a series of lines
            s = s.rp(/(?:\n>.*){2,}/g, function (match) {
                // Strip the leading '>'
                return entag('blockquote', match.rp(/\n>/gm, '\n'));
            });

            // DEFINITION LISTS: Word followed by a colon list
            // Use <dl><dt>term</dt><dd>definition</dd></dl>
            // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl
            s = replaceDefinitionLists(s);
            
            // PARAGRAPH: Newline, any amount of space, newline
            s = s.rp(/\n[\s\n]*?\n/g, '\n\n</p><p>\n\n');

            // STRONG: Must run before italic, since they use the
            // same symbols. **b** __b__
            s = replaceMatched(s, /\*\*/, 'strong', 'asterisk');
            s = replaceMatched(s, /__/, 'strong', 'underscore');

            // E-MAIL ADDRESS: <foo@bar.baz>
            s = s.rp(/<(\S+@(?:\S+\.)+?\S{3,}?)>/g, '<a href="mailto:$1">$1</a>');

            // E-MAIL ADDRESS: <foo@bar.baz>
            s = s.rp(/(?=\b)<(\S+@(?:\S+\.)+?\S{3,}?)>(?=\b)/g, '<a href="mailto:$1">$1</a>');

            // RAW URL: http://baz. Specifically NOT allowed to be in quotes or
            // jammed against other text.
            s = s.rp(/(\s)(\w{3,6}:\/\/.+)(\s|$)/g, '$1<a href="$2">$2</a>$3');

            // URL: <http://baz>
            s = s.rp(/<(\w{3,6}:\/\/.+)>/g, '<a href="$1">$1</a>');

            // EM: *i* _i_
            s = replaceMatched(s, /\*/, 'em', 'asterisk');
            s = replaceMatched(s, /_/, 'em', 'underscore');
            
            // STRIKETHROUGH: ~~text~~
            s = s.rp(/\~\~([^~].*?)\~\~/g, entag('del', '$1'));
            
            
            // IMAGE: ![text](url caption)
            s = s.rp(/!\[([^\[]+)\]\(([^\t \)]+(.*))\)/g, '<img class="markdeep" src="$2" alt="$1"/>');

            // LINKS: [text](url)
            s = s.rp(/\[([^\[]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
            
            // ARROWS:
            s = s.rp(/(\s)==>(\s)/g, '$1&rarr;$2');
            s = s.rp(/(\s)<==(\s)/g, '$1&larr;$2');

            // NUMBER x NUMBER:
            s = s.rp(/(\d+)x(\d+)/g, '$1&times;$2');

            // EM DASH: ---
            s = s.rp(/([^-!])---([^->])/g, '$1&mdash;$2');

            // EN DASH: --
            s = s.rp(/([^-!])--([^->])/g, '$1&ndash;$2');

            // MINUS: -4 or 2 - 1
            s = s.rp(/(\s)-(\d)/g, '$1&minus;$2');
            s = s.rp(/(\d) - (\d)/g, '$1 &minus; $2');

            return s;
        });


        // TABLES: line with | over line containing only | and -
        s = replaceTables(s);

        // ASTERISK LIST: map to - list for processing TODO: Remove
        // s = s.rp(/(\n[ \t]*)\*([ \t].+)/g, '$1-$2'); 

        // LISTS: lines with - or 1.
        s = replaceLists(s);

        return s;
    });

    // Restore protected blocks
    str = str.rp(/<protect>([\s\S]+?)<\/protect>/gm, '$1');

    if (! elementMode) {
        str = insertTableOfContents(str);
    }

    return '<span class="md">' + entag('p', str) + '</span>';
}


/**
   Adds whitespace at the end of each line of str, so that all lines
   have equal length
*/
function equalizeLineLengths(str) {
    var lineArray = str.split('\n');
    var longest = 0;
    lineArray.forEach(function(line) {
        longest = max(longest, line.length);
    });

    // Worst case spaces needed for equalizing lengths
    // http://stackoverflow.com/questions/1877475/repeat-character-n-times
    var spaces = Array(longest + 1).join(' ');

    var result = '';
    lineArray.forEach(function(line) {
        // Append the needed number of spaces onto each line, and
        // reconstruct the output with newlines
        result += line + spaces.ss(line.length) + '\n';
    });

    return result;
}

/** Finds the longest common whitespace prefix of all non-empty lines
    and then removes it */
function removeLeadingSpace(str) {
    var lineArray = str.split('\n');

    var minimum = Infinity;
    lineArray.forEach(function (line) {
        if (line.trim() !== '') {
            // This is a non-empty line
            var spaceArray = line.match(/^([ \t]*)/);
            if (spaceArray) {
                minimum = min(minimum, spaceArray[0].length);
            }
        }
    });

    if (minimum === 0) {
        // No leading space
        return str;
    }

    var result = '';
    lineArray.forEach(function(line) {
        // Strip the common spaces
        result += line.ss(minimum) + '\n';
    });

    return result;
}


/** Converts diagramString, which is a Markdeep diagram without the
    surrounding asterisks, to SVG (HTML). 

    alignmentHint is the float alignment desired for the SVG tag,
    which can be 'left', 'right', or ''
 */
function diagramToSVG(diagramString, alignmentHint) {
    // Clean up diagramString if line endings are ragged
    diagramString = equalizeLineLengths(diagramString);

    /** Pixels per character */
    var SCALE   = 8;

    /** Multiply Y coordinates by this when generating the final SVG
        result to account for the aspect ratio of text files. This
        MUST be 2 */
    var ASPECT = 2;

    var DIAGONAL_ANGLE = Math.atan(1.0 / ASPECT) * 180 / Math.PI;

    var EPSILON = 1e-6;

    // The order of the following is based on rotation angles
    // and is used for ArrowSet.toSVG
    var ARROW_HEAD_CHARACTERS            = '>v<^';
    var POINT_CHARACTERS                 = 'o*';
    var JUMP_CHARACTERS                  = '()';
    var DECORATION_CHARACTERS            = ARROW_HEAD_CHARACTERS + POINT_CHARACTERS + JUMP_CHARACTERS;
    var UNDIRECTED_VERTEX_CHARACTERS     = "+";
    var VERTEX_CHARACTERS                = UNDIRECTED_VERTEX_CHARACTERS + ".'";

    function isUndirectedVertex(c) { return UNDIRECTED_VERTEX_CHARACTERS.indexOf(c) + 1; }
    function isVertex(c)           { return VERTEX_CHARACTERS.indexOf(c) !== -1; }
    function isTopVertex(c)        { return isUndirectedVertex(c) || (c === '.'); }
    function isBottomVertex(c)     { return isUndirectedVertex(c) || (c === "'"); }
    function isVertexOrLeftDecoration(c){ return isVertex(c) || (c === '<') || isPoint(c); }
    function isVertexOrRightDecoration(c){return isVertex(c) || (c === '>') || isPoint(c); }
    function isArrowHead(c)        { return ARROW_HEAD_CHARACTERS.indexOf(c) + 1; }

    // "D" = Diagonal slash (/), "B" = diagonal Backslash (\)
    // Characters that may appear anywhere on a solid line
    function isSolidHLine(c)       { return (c === '-') || isUndirectedVertex(c) || isJump(c); }
    function isSolidVLineOrJumpOrPoint(c) { return isSolidVLine(c) || isJump(c) || isPoint(c); }
    function isSolidVLine(c)       { return (c === '|') || isUndirectedVertex(c); }
    function isSolidDLine(c)       { return (c === '/') || isUndirectedVertex(c) }
    function isSolidBLine(c)       { return (c === '\\') || isUndirectedVertex(c); }
    function isJump(c)             { return JUMP_CHARACTERS.indexOf(c) + 1; }
    function isPoint(c)            { return POINT_CHARACTERS.indexOf(c) + 1; }
    function isDecoration(c)       { return DECORATION_CHARACTERS.indexOf(c) + 1; }
    function isEmpty(c)            { return c === ' '; }
   
    ///////////////////////////////////////////////////////////////////////////////
    // Math library

    /** Invoke as new Vec2(v) to clone or new Vec2(x, y) to create from coordinates.
        Can also invoke without new for brevity. */
    function Vec2(x, y) {
        // Detect when being run without new
        if (! (this instanceof Vec2)) { return new Vec2(x, y); }

        if (y === undefined) {
            if (x === undefined) { x = y = 0; } 
            else if (x instanceof Vec2) { y = x.y; x = x.x; }
            else { console.error("Vec2 requires one Vec2 or (x, y) as an argument"); }
        }
        this.x = x;
        this.y = y;
        Object.seal(this);
    }

    /** Returns an SVG representation */
    Vec2.prototype.toString = Vec2.prototype.toSVG = 
        function () { return '' + (this.x * SCALE) + ',' + (this.y * SCALE * ASPECT) + ' '; };

    /** The grid is */
    function makeGrid(str) {
        /** Converts a "rectangular" string defined by newlines into 2D
            array of characters. Grids are immutable. */

        /** Returns ' ' for out of bounds values */
        var grid = function(x, y) {
            if (y === undefined) {
                if (x instanceof Vec2) { y = x.y; x = x.x; }
                else { console.error('grid requires either a Vec2 or (x, y)'); }
            }
            
            return ((x >= 0) && (x < grid.width) && (y >= 0) && (y < grid.height)) ?
                str[y * (grid.width + 1) + x] : ' ';
        };

        // Elements are true when consumed
        grid._used   = [];

        grid.width   = str.indexOf('\n');
        grid.height  = str.split('\n').length;
        if (str[str.length - 1] === '\n') { --grid.height; }

        /** Mark this location. Takes a Vec2 or (x, y) */
        grid.setUsed = function (x, y) {
            if (y === undefined) {
                if (x instanceof Vec2) { y = x.y; x = x.x; }
                else { console.error('grid requires either a Vec2 or (x, y)'); }
            }
            if ((x >= 0) && (x < grid.width) && (y >= 0) && (y < grid.height)) {
                // Match the source string indexing
                grid._used[y * (grid.width + 1) + x] = true;
            }
        };
        
        grid.isUsed = function (x, y) {
            if (y === undefined) {
                if (x instanceof Vec2) { y = x.y; x = x.x; }
                else { console.error('grid requires either a Vec2 or (x, y)'); }
            }
            return (this._used[y * (this.width + 1) + x] === true);
        };
        
        /** Returns true if there is a solid vertical line passing through (x, y) */
        grid.isSolidVLineAt = function (x, y) {
            if (y === undefined) { y = x.x; x = x.x; }
            
            var up = grid(x, y - 1);
            var c  = grid(x, y);
            var dn = grid(x, y + 1);
            
            var uprt = grid(x + 1, y - 1);
            var uplt = grid(x - 1, y - 1);
            
            if (isSolidVLine(c)) {
                // Looks like a vertical line...does it continue?
                return (isTopVertex(up)    || (up === '^') || isSolidVLine(up) || isJump(up) ||
                        isBottomVertex(dn) || (dn === 'v') || isSolidVLine(dn) || isJump(dn) ||
                        isPoint(up) || isPoint(dn) || (grid(x, y - 1) === '_') || (uplt === '_') ||
                        (uprt === '_') ||
                        
                        // Special case of 1-high vertical on two curved corners 
                        ((isTopVertex(uplt) || isTopVertex(uprt)) &&
                         (isBottomVertex(grid(x - 1, y + 1)) || isBottomVertex(grid(x + 1, y + 1)))));
                
            } else if (isTopVertex(c) || (c === '^')) {
                // May be the top of a vertical line
                return isSolidVLine(dn) || (isJump(dn) && (c !== '.'));
            } else if (isBottomVertex(c) || (c === 'v')) {
                return isSolidVLine(up) || (isJump(up) && (c !== "'"));
            } else if (isPoint(c)) {
                return isSolidVLine(up) || isSolidVLine(dn);
            } 
            
            return false;
        };
    
    
        /** Returns true if there is a solid middle (---) horizontal line
            passing through (x, y). Ignores underscores. */
        grid.isSolidHLineAt = function (x, y) {
            if (y === undefined) { y = x.x; x = x.x; }
            
            var ltlt = grid(x - 2, y);
            var lt   = grid(x - 1, y);
            var c    = grid(x + 0, y);
            var rt   = grid(x + 1, y);
            var rtrt = grid(x + 2, y);
            
            if (isSolidHLine(c) || (isSolidHLine(lt) && isJump(c))) {
                // Looks like a horizontal line...does it continue? We need three in a row.
                if (isSolidHLine(lt)) {
                    return isSolidHLine(rt) || isVertexOrRightDecoration(rt) || 
                        isSolidHLine(ltlt) || isVertexOrLeftDecoration(ltlt);
                } else if (isVertexOrLeftDecoration(lt)) {
                    return isSolidHLine(rt);
                } else {
                    return isSolidHLine(rt) && (isSolidHLine(rtrt) || isVertexOrRightDecoration(rtrt));
                }

            } else if (c === '<') {
                return isSolidHLine(rt) && isSolidHLine(rtrt)
                
            } else if (c === '>') {
                return isSolidHLine(lt) && isSolidHLine(ltlt);
                
            } else if (isVertex(c)) {
                return ((isSolidHLine(lt) && isSolidHLine(ltlt)) || 
                        (isSolidHLine(rt) && isSolidHLine(rtrt)));
            }
            
            return false;
        };
        
        
        /** Returns true if there is a solid backslash line passing through (x, y) */
        grid.isSolidBLineAt = function (x, y) {
            if (y === undefined) { y = x.x; x = x.x; }
            var c = grid(x, y);
            var lt = grid(x - 1, y - 1);
            var rt = grid(x + 1, y + 1);
            
            if (c === '\\') {
                // Looks like a diagonal line...does it continue? We need two in a row.
                return (isSolidBLine(rt) || isBottomVertex(rt) || isPoint(rt) || (rt === 'v') ||
                        isSolidBLine(lt) || isTopVertex(lt) || isPoint(lt) || (lt === '^') ||
                        (grid(x, y - 1) === '/') || (grid(x, y + 1) === '/') || (rt === '_') || (lt === '_')); 
            } else if (c === '.') {
                return (rt === '\\');
            } else if (c === "'") {
                return (lt === '\\');
            } else if (c === '^') {
                return rt === '\\';
            } else if (c === 'v') {
                return lt === '\\';
            } else if (isVertex(c) || isPoint(c) || (c === '|')) {
                return isSolidBLine(lt) || isSolidBLine(rt);
            }
        };
        

        /** Returns true if there is a solid diagonal line passing through (x, y) */
        grid.isSolidDLineAt = function (x, y) {
            if (y === undefined) { y = x.x; x = x.x; }
            
            var c = grid(x, y);
            var lt = grid(x - 1, y + 1);
            var rt = grid(x + 1, y - 1);
            
            if (c === '/' && ((grid(x, y - 1) === '\\') || (grid(x, y + 1) === '\\'))) {
                // Special case of tiny hexagon corner
                return true;
            } else if (isSolidDLine(c)) {
                // Looks like a diagonal line...does it continue? We need two in a row.
                return (isSolidDLine(rt) || isTopVertex(rt) || isPoint(rt) || (rt === '^') || (rt === '_') ||
                        isSolidDLine(lt) || isBottomVertex(lt) || isPoint(lt) || (lt === 'v') || (lt === '_')); 
            } else if (c === '.') {
                return (lt === '/');
            } else if (c === "'") {
                return (rt === '/');
            } else if (c === '^') {
                return lt === '/';
            } else if (c === 'v') {
                return rt === '/';
            } else if (isVertex(c) || isPoint(c) || (c === '|')) {
                return isSolidDLine(lt) || isSolidDLine(rt);
            }
            return false;
        };
        
        grid.toString = function () { return str; };
        
        return Object.freeze(grid);
    }
    
    
    /** A 1D curve. If C is specified, the result is a bezier with
        that as the tangent control point */
    function Path(A, B, C, D) {
        if (! ((A instanceof Vec2) && (B instanceof Vec2))) {
            console.error('Path constructor requires at least two Vec2s');
        }
        this.A = A;
        this.B = B;
        if (C) {
            this.C = C;
            if (D) {
                this.D = D;
            } else {
                this.D = C;
            }
        }
        Object.freeze(this);
    }

    var _ = Path.prototype;
    _.isVertical = function () {
        return this.B.x === this.A.x;
    };

    _.isHorizontal = function () {
        return this.B.y === this.A.y;
    };

    /** Diagonal lines look like: / See also backDiagonal */
    _.isDiagonal = function () {
        var dx = this.B.x - this.A.x;
        var dy = this.B.y - this.A.y;
        return (Math.abs(dy + dx) < EPSILON);
    };

    _.isBackDiagonal = function () {
        var dx = this.B.x - this.A.x;
        var dy = this.B.y - this.A.y;
        return (Math.abs(dy - dx) < EPSILON);
    };

    _.isCurved = function () {
        return this.C !== undefined;
    };

    /** Does this path have any end at (x, y) */
    _.endsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return ((this.A.x === x) && (this.A.y === y)) ||
            ((this.B.x === x) && (this.B.y === y));
    };

    /** Does this path have an up end at (x, y) */
    _.upEndsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isVertical() && (this.A.x === x) && (min(this.A.y, this.B.y) === y);
    };

    /** Does this path have an up end at (x, y) */
    _.diagonalUpEndsAt = function (x, y) {
        if (! this.isDiagonal()) { return false; }
        if (y === undefined) { y = x.y; x = x.x; }
        if (this.A.y < this.B.y) {
            return (this.A.x === x) && (this.A.y === y);
        } else {
            return (this.B.x === x) && (this.B.y === y);
        }
    };

    /** Does this path have a down end at (x, y) */
    _.diagonalDownEndsAt = function (x, y) {
        if (! this.isDiagonal()) { return false; }
        if (y === undefined) { y = x.y; x = x.x; }
        if (this.B.y < this.A.y) {
            return (this.A.x === x) && (this.A.y === y);
        } else {
            return (this.B.x === x) && (this.B.y === y);
        }
    };

    /** Does this path have an up end at (x, y) */
    _.backDiagonalUpEndsAt = function (x, y) {
        if (! this.isBackDiagonal()) { return false; }
        if (y === undefined) { y = x.y; x = x.x; }
        if (this.A.y < this.B.y) {
            return (this.A.x === x) && (this.A.y === y);
        } else {
            return (this.B.x === x) && (this.B.y === y);
        }
    };

    /** Does this path have a down end at (x, y) */
    _.backDiagonalDownEndsAt = function (x, y) {
        if (! this.isBackDiagonal()) { return false; }
        if (y === undefined) { y = x.y; x = x.x; }
        if (this.B.y < this.A.y) {
            return (this.A.x === x) && (this.A.y === y);
        } else {
            return (this.B.x === x) && (this.B.y === y);
        }
    };

    /** Does this path have a down end at (x, y) */
    _.downEndsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isVertical() && (this.A.x === x) && (max(this.A.y, this.B.y) === y);
    };

    /** Does this path have a left end at (x, y) */
    _.leftEndsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isHorizontal() && (this.A.y === y) && (min(this.A.x, this.B.x) === x);
    };

    /** Does this path have a right end at (x, y) */
    _.rightEndsAt = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isHorizontal() && (this.A.y === y) && (max(this.A.x, this.B.x) === x);
    };

    _.verticalPassesThrough = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isVertical() && 
            (this.A.x === x) && 
            (min(this.A.y, this.B.y) <= y) &&
            (max(this.A.y, this.B.y) >= y);
    }

    _.horizontalPassesThrough = function (x, y) {
        if (y === undefined) { y = x.y; x = x.x; }
        return this.isHorizontal() && 
            (this.A.y === y) && 
            (min(this.A.x, this.B.x) <= x) &&
            (max(this.A.x, this.B.x) >= x);
    }
    
    /** Returns a string suitable for inclusion in an SVG tag */
    _.toSVG = function () {
        var svg = '<path d="M ' + this.A;

        if (this.isCurved()) {
            svg += 'C ' + this.C + this.D + this.B;
        } else {
            svg += 'L ' + this.B;
        }
        svg += '" style="fill:none;stroke:#000;"';
        
        svg += '/>';
        return svg;
    };


    /** A group of 1D curves. This was designed so that all of the
        methods can later be implemented in O(1) time, but it
        currently uses O(n) implementations for source code
        simplicity. */
    function PathSet() {
        this._pathArray = [];
    }

    var PS = PathSet.prototype;
    PS.insert = function (path) {
        this._pathArray.push(path);
    };

    /** Returns a new method that returns true if method(x, y) 
        returns true on any element of _pathAray */
    function makeFilterAny(method) {
        return function(x, y) {
            for (var i = 0; i < this._pathArray.length; ++i) {
                if (method.call(this._pathArray[i], x, y)) { return true; }
            }
            return false;
        }
    }

    // True if an up line ends at these coordinates. Recall that the
    // variable _ is bound to the Path prototype still.
    PS.upEndsAt                = makeFilterAny(_.upEndsAt);
    PS.diagonalUpEndsAt        = makeFilterAny(_.diagonalUpEndsAt);
    PS.backDiagonalUpEndsAt    = makeFilterAny(_.backDiagonalUpEndsAt);
    PS.diagonalDownEndsAt      = makeFilterAny(_.diagonalDownEndsAt);
    PS.backDiagonalDownEndsAt  = makeFilterAny(_.backDiagonalDownEndsAt);
    PS.downEndsAt              = makeFilterAny(_.downEndsAt);
    PS.leftEndsAt              = makeFilterAny(_.leftEndsAt);
    PS.rightEndsAt             = makeFilterAny(_.rightEndsAt);
    PS.endsAt                  = makeFilterAny(_.endsAt);
    PS.verticalPassesThrough   = makeFilterAny(_.verticalPassesThrough);
    PS.horizontalPassesThrough = makeFilterAny(_.horizontalPassesThrough);

    /** Returns an SVG string */
    PS.toSVG = function () {
        var svg = '';
        for (var i = 0; i < this._pathArray.length; ++i) {
            svg += this._pathArray[i].toSVG() + '\n';
        }
        return svg;
    };


    function DecorationSet() {
        this._decorationArray = [];
    }

    var DS = DecorationSet.prototype;

    /** insert(x, y, type, <angle>)  
        insert(vec, type, <angle>)

        angle is the angle in degrees to rotate the result */
    DS.insert = function(x, y, type, angle) {
        if (type === undefined) { type = y; y = x.y; x = x.x; }

        if (! isDecoration(type)) {
            console.error('Illegal decoration character: ' + type); 
        }
        var d = {C: Vec2(x, y), type: type, angle:angle || 0};

        // Put arrows at the front and points at the back so that
        // arrows always draw under points

        if (isPoint(type)) {
            this._decorationArray.push(d);
        } else {
            this._decorationArray.unshift(d);
        }
    };


    DS.toSVG = function () {
        var svg = '';
        for (var i = 0; i < this._decorationArray.length; ++i) {
            var decoration = this._decorationArray[i];
            var C = decoration.C;
            
            if (isJump(decoration.type)) {
                // Slide jumps
                var dx = (decoration.type === ')') ? +0.75 : -0.75;
                var up  = Vec2(C.x, C.y - 0.5);
                var dn  = Vec2(C.x, C.y + 0.5);
                var cup = Vec2(C.x + dx, C.y - 0.5);
                var cdn = Vec2(C.x + dx, C.y + 0.5);

                svg += '<path d="M ' + dn + ' C ' + cdn + cup + up + '" style="fill:none;stroke:#000;"/>';

            } else if (isPoint(decoration.type)) {

                svg += '<circle cx="' + (C.x * SCALE) + '" cy="' + (C.y * SCALE * ASPECT) +
                       '" r="' + (SCALE - STROKE_WIDTH) + '" style="fill:' +
                    ((decoration.type === '*') ? '#000' : '#FFF') + 
                    ';stroke:#000;"/>';

            } else { // Arrow head
                var tip = Vec2(C.x + 1, C.y);
                var up =  Vec2(C.x - 0.5, C.y - 0.35);
                var dn =  Vec2(C.x - 0.5, C.y + 0.35);
                svg += '<polygon points="' + tip + up + dn + 
                    '" style="fill:#000" transform="rotate(' + decoration.angle + ',' + C + ')"/>\n';
            }
        }
        return svg;
    };

    ////////////////////////////////////////////////////////////////////////////

    function findPaths(grid, pathSet) {
        // Find all solid vertical lines. Iterate horizontally
        // so that we never hit the same line twice
        for (var x = 0; x < grid.width; ++x) {
            for (var y = 0; y < grid.height; ++y) {
                if (grid.isSolidVLineAt(x, y)) {
                    // This character begins a vertical line...now, find the end
                    var A = Vec2(x, y);
                    do  { grid.setUsed(x, y); ++y; } while (grid.isSolidVLineAt(x, y));
                    var B = Vec2(x, y - 1);
                    
                    var up = grid(A);
                    var upup = grid(A.x, A.y - 1);

                    if (! isVertex(up) && ((upup === '-') || (upup === '_') || (grid(A.x - 1, A.y - 1) === '_') ||
                                           (grid(A.x + 1, A.y - 1) === '_') || 
                                           isBottomVertex(upup)) || isJump(upup)) {
                        // Stretch up to almost reach the line above (if there is a decoration,
                        // it will finish the gap)
                        A.y -= 0.5;
                    }

                    var dn = grid(B);
                    var dndn = grid(B.x, B.y + 1);
                    if (! isVertex(dn) && ((dndn === '-') || isTopVertex(dndn)) || isJump(dndn) ||
                        (grid(B.x - 1, B.y) === '_') || (grid(B.x + 1, B.y) === '_')) {
                        // Stretch down to almost reach the line below
                        B.y += 0.5;
                    }

                    // Don't insert degenerate lines
                    if ((A.x !== B.x) || (A.y !== B.y)) {
                        pathSet.insert(new Path(A, B));
                    }

                    // Continue the search from the end value y+1
                } 

                // Some very special patterns for the short lines needed on
                // circuit diagrams. Only invoke these if not also on a curve
                //      _  _    
                //    -'    '-
                else if ((grid(x, y) === "'") &&
                    (((grid(x - 1, y) === '-') && (grid(x + 1, y - 1) === '_') &&
                     ! isSolidVLineOrJumpOrPoint(grid(x - 1, y - 1))) ||
                     ((grid(x - 1, y - 1) === '_') && (grid(x + 1, y) === '-') &&
                     ! isSolidVLineOrJumpOrPoint(grid(x + 1, y - 1))))) {
                    pathSet.insert(new Path(Vec2(x, y - 0.5), Vec2(x, y)));
                }

                //    _.-  -._ 
                else if ((grid(x, y) === '.') &&
                         (((grid(x - 1, y) === '_') && (grid(x + 1, y) === '-') && 
                           ! isSolidVLineOrJumpOrPoint(grid(x + 1, y + 1))) ||
                          ((grid(x - 1, y) === '-') && (grid(x + 1, y) === '_') &&
                           ! isSolidVLineOrJumpOrPoint(grid(x - 1, y + 1))))) {
                    pathSet.insert(new Path(Vec2(x, y), Vec2(x, y + 0.5)));
                }

            } // y
        } // x
        
        
        // Find all solid horizontal lines 
        for (var y = 0; y < grid.height; ++y) {
            for (var x = 0; x < grid.width; ++x) {
                if (grid.isSolidHLineAt(x, y)) {
                    // Begins a line...find the end
                    var A = Vec2(x, y);
                    do { grid.setUsed(x, y); ++x; } while (grid.isSolidHLineAt(x, y));
                    var B = Vec2(x - 1, y);

                    // Detect curves and shorten the edge
                    if ( ! isVertex(grid(A.x - 1, A.y)) && 
                         ((isTopVertex(grid(A)) && isSolidVLineOrJumpOrPoint(grid(A.x - 1, A.y + 1))) ||
                          (isBottomVertex(grid(A)) && isSolidVLineOrJumpOrPoint(grid(A.x - 1, A.y - 1))))) {
                        ++A.x;
                    }

                    if ( ! isVertex(grid(B.x + 1, B.y)) && 
                         ((isTopVertex(grid(B)) && isSolidVLineOrJumpOrPoint(grid(B.x + 1, B.y + 1))) ||
                          (isBottomVertex(grid(B)) && isSolidVLineOrJumpOrPoint(grid(B.x + 1, B.y - 1))))) {
                        --B.x;
                    }

                    // Don't insert degenerate lines
                    if ((A.x !== B.x) || (A.y !== B.y)) {
                        pathSet.insert(new Path(A, B));
                    }
                    // Continue the search from the end x+1
                }
            }
        } // y


        // Find all solid left-to-right downward diagonal lines (BACK DIAGONAL)
        for (var i = -grid.height; i < grid.width; ++i) {
            for (var x = i, y = 0; y < grid.height; ++y, ++x) {
                if (grid.isSolidBLineAt(x, y)) {
                    // Begins a line...find the end
                    var A = Vec2(x, y);
                    do { grid.setUsed(x, y); ++x; ++y; } while (grid.isSolidBLineAt(x, y));
                    var B = Vec2(x - 1, y - 1);

                    var up = grid(A.x, A.y - 1);
                    var uplt = grid(A.x - 1, A.y - 1);
                    if ((up === '/') || (uplt === '_') || (up === '_') || 
                        (! isVertex(grid(A)) && (isSolidHLine(uplt) || isSolidVLine(uplt)))) {
                        // Continue half a cell more to connect for:
                        //  ___   ___
                        //  \        \    /      ----     |
                        //   \        \   \        ^      |^
                        //                          \     | \ 
                        A.x -= 0.5; A.y -= 0.5;
                    } else if (isPoint(uplt)) {
                        // Continue 1/4 cell more to connect for:
                        //
                        //  o
                        //   ^
                        //    \
                        A.x -= 0.25; A.y -= 0.25;
                    }

                    var dnrt = grid(B.x + 1, B.y + 1);
                    if ((grid(B.x, B.y + 1) === '/') || (grid(B.x + 1, B.y) === '_') || 
                        (grid(B.x - 1, B.y) === '_') || 
                        (! isVertex(grid(B)) && (isSolidHLine(dnrt) || isSolidVLine(dnrt)))) {
                        // Continue half a cell more to connect for:
                        //                       \      \ |
                        //  \       \     \       v      v|
                        //   \__   __\    /      ----     |
                        //                                

                        B.x += 0.5; B.y += 0.5;
                    } else if (isPoint(dnrt)) {
                        // Continue 1/4 cell more to connect for:
                        //
                        //    \
                        //     v
                        //      o

                        B.x += 0.25; B.y += 0.25;
                    }

                    pathSet.insert(new Path(A, B));
                    // Continue the search from the end x+1,y+1
                }
            }
        } // i


        // Find all solid left-to-right upward diagonal lines (DIAGONAL)
        for (var i = -grid.height; i < grid.width; ++i) {
            for (var x = i, y = grid.height - 1; y >= 0; --y, ++x) {
                if (grid.isSolidDLineAt(x, y)) {
                    // Begins a line...find the end
                    var A = Vec2(x, y);
                    do { grid.setUsed(x, y); ++x; --y; } while (grid.isSolidDLineAt(x, y));
                    var B = Vec2(x - 1, y + 1);

                    var up = grid(B.x, B.y - 1);
                    var uprt = grid(B.x + 1, B.y - 1);
                    if ((up === '\\') || (up === '_') || (uprt === '_') || 
                        (! isVertex(grid(B)) && (isSolidHLine(uprt) || isSolidVLine(uprt)))) {

                        // Continue half a cell more to connect at:
                        //     __   __  ---     |
                        //    /      /   ^     ^|
                        //   /      /   /     / |

                        B.x += 0.5; B.y -= 0.5;
                    } else if (isPoint(uprt)) {

                        // Continue 1/4 cell more to connect at:
                        //
                        //       o
                        //      ^
                        //     /

                        B.x += 0.25; B.y -= 0.25;
                    }

                    var dnlt = grid(A.x - 1, A.y + 1);
                    if ((grid(A.x, A.y + 1) === '\\') || (grid(A.x - 1, A.y) === '_') || (grid(A.x + 1, A.y) === '_') ||
                        (! isVertex(grid(A)) && (isSolidHLine(dnlt) || isSolidVLine(dnlt)))) {

                        // Continue half a cell more to connect at:
                        //               /     \ |
                        //    /  /      v       v|
                        // __/  /__   ----       | 

                        A.x -= 0.5; A.y += 0.5;
                    } else if (isPoint(dnlt)) {

                        // Continue 1/4 cell more to connect at:
                        //
                        //       /
                        //      v
                        //     o

                        A.x -= 0.25; A.y += 0.25;
                    }

                    pathSet.insert(new Path(A, B));

                    // Continue the search from the end x+1,y-1
                }
            }
        } // y
        
        
        // Now look for curved corners. The syntax constraints require
        // that these can always be identified by looking at three
        // horizontally-adjacent characters.
        for (var y = 0; y < grid.height; ++y) {
            for (var x = 0; x < grid.width; ++x) {
                var c = grid(x, y);

                // Note that because of undirected vertices, the
                // following cases are not exclusive
                if (isTopVertex(c)) {
                    // -.
                    //   |
                    if (isSolidHLine(grid(x - 1, y)) && isSolidVLine(grid(x + 1, y + 1))) {
                        grid.setUsed(x - 1, y); grid.setUsed(x, y); grid.setUsed(x + 1, y + 1);
                        pathSet.insert(new Path(Vec2(x - 1, y), Vec2(x + 1, y + 1), 
                                                Vec2(x + 1.1, y), Vec2(x + 1, y + 1)));
                    }

                    //  .-
                    // |
                    if (isSolidHLine(grid(x + 1, y)) && isSolidVLine(grid(x - 1, y + 1))) {
                        grid.setUsed(x - 1, y + 1); grid.setUsed(x, y); grid.setUsed(x + 1, y);
                        pathSet.insert(new Path(Vec2(x + 1, y), Vec2(x - 1, y + 1), 
                                                Vec2(x - 1.1, y), Vec2(x - 1, y + 1)));
                    }
                }
                
                // Special case patterns:
                //   .  .   .  .    
                //  (  o     )  o
                //   '  .   '  '
                if (((c === ')') || isPoint(c)) && (grid(x - 1, y - 1) === '.') && (grid(x - 1, y + 1) === "\'")) {
                    grid.setUsed(x, y); grid.setUsed(x - 1, y - 1); grid.setUsed(x - 1, y + 1);
                    pathSet.insert(new Path(Vec2(x - 2, y - 1), Vec2(x - 2, y + 1), 
                                            Vec2(x + 0.6, y - 1), Vec2(x + 0.6, y + 1)));
                }

                if (((c === '(') || isPoint(c)) && (grid(x + 1, y - 1) === '.') && (grid(x + 1, y + 1) === "\'")) {
                    grid.setUsed(x, y); grid.setUsed(x + 1, y - 1); grid.setUsed(x + 1, y + 1);
                    pathSet.insert(new Path(Vec2(x + 2, y - 1), Vec2(x + 2, y + 1), 
                                            Vec2(x - 0.6, y - 1), Vec2(x - 0.6, y + 1)));
                }

                if (isBottomVertex(c)) {
                    //   |
                    // -' 
                    if (isSolidHLine(grid(x - 1, y)) && isSolidVLine(grid(x + 1, y - 1))) {
                        grid.setUsed(x - 1, y); grid.setUsed(x, y); grid.setUsed(x + 1, y - 1);
                        pathSet.insert(new Path(Vec2(x - 1, y), Vec2(x + 1, y - 1), 
                                                Vec2(x + 1.1, y), Vec2(x + 1, y - 1)));
                    }

                    // | 
                    //  '-
                    if (isSolidHLine(grid(x + 1, y)) && isSolidVLine(grid(x - 1, y - 1))) {
                        grid.setUsed(x - 1, y - 1); grid.setUsed(x, y); grid.setUsed(x + 1, y);
                        pathSet.insert(new Path(Vec2(x + 1, y), Vec2(x - 1, y - 1),
                                                Vec2(x - 1.1, y), Vec2(x - 1, y - 1)));
                    }
                }
               
            } // for x
        } // for y

        // Find low horizontal lines marked with underscores. These
        // are so simple compared to the other cases that we process
        // them directly here without a helper function. Process these
        // from top to bottom and left to right so that we can read
        // them in a single sweep.
        for (var y = 0; y < grid.height; ++y) {
            for (var x = 0; x < grid.width - 2; ++x) {
                if ((grid(x, y) === '_') && (grid(x + 1, y) === '_')) {
                    var A = Vec2(x - 0.5, y + 0.5);

                    var lt = grid(x - 1, y);
                    var ltlt = grid(x - 2, y);

                    if ((lt === '|') || (grid(x - 1, y + 1) === '|') ||
                        (lt === '.') || (grid(x - 1, y + 1) === "'")) {
                        // Extend to meet adjacent vertical
                        A.x -= 0.5;

                        // Very special case of overrunning into the side of a curve,
                        // needed for logic gate diagrams
                        if ((lt === '.') && 
                            ((ltlt === '-') ||
                             (ltlt === '.')) &&
                            (grid(x - 2, y + 1) === '(')) {
                            A.x -= 0.5;
                        }
                    } else if (lt === '/') {
                        A.x -= 1.0;
                    }

                    // Detect overrun of a tight double curve
                    if ((lt === '(') && (ltlt === '(') &&
                        (grid(x, y + 1) === "'") && (grid(x, y - 1) === '.')) {
                        A.x += 0.5;
                    }
                    lt = ltlt = undefined;

                    do { grid.setUsed(x, y); ++x; } while (grid(x, y) === '_');

                    var B = Vec2(x - 0.5, y + 0.5);
                    var c = grid(x, y);
                    var rt = grid(x + 1, y);
                    var dn = grid(x, y + 1);

                    if ((c === '|') || (dn === '|') || (c === '.') || (dn === "'")) {
                        // Extend to meet adjacent vertical
                        B.x += 0.5;

                        // Very special case of overrunning into the side of a curve,
                        // needed for logic gate diagrams
                        if ((c === '.') && 
                            ((rt === '-') || (rt === '.')) &&
                            (grid(x + 1, y + 1) === ')')) {
                            B.x += 0.5;
                        }
                    } else if ((c === '\\')) {
                        B.x += 1.0;
                    }

                    // Detect overrun of a tight double curve
                    if ((c === ')') && (rt === ')') && (grid(x - 1, y + 1) === "'") && (grid(x - 1, y - 1) === '.')) {
                        B.x += -0.5;
                    }

                    pathSet.insert(new Path(A, B));
                }
            } // for x
        } // for y

    } // findPaths


    function findDecorations(grid, pathSet, decorationSet) {
        function isEmptyOrVertex(c, k) { return isEmpty(c) || isVertex(c) || (c == k); }
                    
        /** Is the point in the center of these values on a line? */
        function onLine(up, dn, lt, rt) {
            return (isEmptyOrVertex(dn, '|') &&
                    isEmptyOrVertex(up, '|') &&
                    isEmptyOrVertex(rt, '-') &&
                    isEmptyOrVertex(lt, '-'));
        }
        
        for (var x = 0; x < grid.width; ++x) {
            for (var j = 0; j < grid.height; ++j) {
                var c = grid(x, j);
                var y = j;

                if (isJump(c)) {

                    // Ensure that this is really a jump and not a stray character
                    if (pathSet.downEndsAt(x, y - 0.5) &&
                        pathSet.upEndsAt(x, y + 0.5)) {
                        decorationSet.insert(x, y, c);
                        grid.setUsed(x, y);
                    }

                } else if (isPoint(c)) {
                    var up = grid(x, y - 1);
                    var dn = grid(x, y + 1);
                    var lt = grid(x - 1, y);
                    var rt = grid(x + 1, y);

                    if (pathSet.rightEndsAt(x - 1, y) ||   // Must be at the end of a line...
                        pathSet.leftEndsAt(x + 1, y) ||    // or completely isolated NSEW
                        pathSet.downEndsAt(x, y - 1) ||
                        pathSet.upEndsAt(x, y + 1) ||

                        //pathSet.upEndsAt(x, y) ||    // For points on vertical lines 
                        //pathSet.downEndsAt(x, y) ||  // (now covered by below case)

                        onLine(up, dn, lt, rt)) {
                        
                        decorationSet.insert(x, y, c);
                        grid.setUsed(x, y);
                    }

                } else { // Arrow heads

                    // If we find one, ensure that it is really an
                    // arrow head and not a stray character by looking
                    // for a connecting line.
                    var dx = 0;
                    if ((c === '>') && (pathSet.rightEndsAt(x, y) || 
                                        pathSet.horizontalPassesThrough(x, y))) {
                        if (isPoint(grid(x + 1, y))) {
                            // Back up if connecting to a point so as to not
                            // overlap it
                            dx = -0.5;
                        }
                        decorationSet.insert(x + dx, y, '>', 0);
                        grid.setUsed(x, y);
                    } else if ((c === '<') && (pathSet.leftEndsAt(x, y) ||
                                               pathSet.horizontalPassesThrough(x, y))) {
                        if (isPoint(grid(x - 1, y))) {
                            // Back up if connecting to a point so as to not
                            // overlap it
                            dx = 0.5;
                        }
                        decorationSet.insert(x + dx, y, '>', 180); 
                        grid.setUsed(x, y);
                    } else if (c === '^') {
                        // Because of the aspect ratio, we need to look
                        // in two slots for the end of the previous line
                        if (pathSet.upEndsAt(x, y - 0.5)) {
                            decorationSet.insert(x, y - 0.5, '>', 270); 
                            grid.setUsed(x, y);
                        } else if (pathSet.upEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 270);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalUpEndsAt(x + 0.5, y - 0.5)) {
                            decorationSet.insert(x + 0.5, y - 0.5, '>', 270 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalUpEndsAt(x + 0.25, y - 0.25)) {
                            decorationSet.insert(x + 0.25, y - 0.25, '>', 270 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalUpEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 270 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalUpEndsAt(x, y)) {
                            decorationSet.insert(x, y, c, 270 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalUpEndsAt(x - 0.5, y - 0.5)) {
                            decorationSet.insert(x - 0.5, y - 0.5, c, 270 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalUpEndsAt(x - 0.25, y - 0.25)) {
                            decorationSet.insert(x - 0.25, y - 0.25, c, 270 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.verticalPassesThrough(x, y)) {
                            // Only try this if all others failed
                            decorationSet.insert(x, y - 0.5, '>', 270); 
                            grid.setUsed(x, y);
                        }
                    } else if (c === 'v') {
                        if (pathSet.downEndsAt(x, y + 0.5)) {
                            decorationSet.insert(x, y + 0.5, '>', 90); 
                            grid.setUsed(x, y);
                        } else if (pathSet.downEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 90);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalDownEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 90 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalDownEndsAt(x - 0.5, y + 0.5)) {
                            decorationSet.insert(x - 0.5, y + 0.5, '>', 90 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.diagonalDownEndsAt(x - 0.25, y + 0.25)) {
                            decorationSet.insert(x - 0.25, y + 0.25, '>', 90 + DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalDownEndsAt(x, y)) {
                            decorationSet.insert(x, y, '>', 90 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalDownEndsAt(x + 0.5, y + 0.5)) {
                            decorationSet.insert(x + 0.5, y + 0.5, '>', 90 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.backDiagonalDownEndsAt(x + 0.25, y + 0.25)) {
                            decorationSet.insert(x + 0.25, y + 0.25, '>', 90 - DIAGONAL_ANGLE);
                            grid.setUsed(x, y);
                        } else if (pathSet.verticalPassesThrough(x, y)) {
                            // Only try this if all others failed
                            decorationSet.insert(x, y + 0.5, '>', 90); 
                            grid.setUsed(x, y);
                        }
                    }
                } // is arrow head
            } // y
        } // x
    } // findArrowHeads

    //var grid = new Grid(diagramString);
    var grid = makeGrid(diagramString);

    var pathSet = new PathSet();
    var decorationSet = new DecorationSet();

    findPaths(grid, pathSet);
    findDecorations(grid, pathSet, decorationSet);

    var svg = '<svg class="diagram" xmlns="http://www.w3.org/2000/svg" version="1.1" height="' + 
        ((grid.height + 1) * SCALE * ASPECT) + '" width="' + ((grid.width + 1) * SCALE) + '"';

    if (alignmentHint === 'left') {
        svg += ' style="float:' + alignmentHint + ';margin: 15px 30px 15px 0px;"';
    } else if (alignmentHint === 'right') {
        svg += ' style="float:' + alignmentHint + ';margin: 15px 0px 15px 30px;"';
    }

    svg += '><g transform="translate(' + Vec2(1, 1) + ')">\n';

    if (DEBUG_SHOW_GRID) {
        svg += '<g style="opacity:0.1">\n';
        for (var x = 0; x < grid.width; ++x) {
            for (var y = 0; y < grid.height; ++y) {
                svg += '<rect x="' + ((x - 0.5) * SCALE + 1) + '" + y="' + ((y - 0.5) * SCALE * ASPECT + 2) + '" width="' + (SCALE - 2) + '" height="' + (SCALE * ASPECT - 2) + '" style="fill:';
                if (grid.isUsed(x, y)) {
                    svg += 'red;';
                } else if (grid(x, y) === ' ') {
                    svg += 'gray; opacity:0.05';
                } else {
                    svg += 'blue;';
                }
                svg += '"/>\n';
            }
        }
        svg += '</g>\n';
    }
    
    svg += pathSet.toSVG();
    svg += decorationSet.toSVG();

    // Convert any remaining characters
    if (! DEBUG_HIDE_PASSTHROUGH) {
        svg += '<g transform="translate(0,0)">';
        for (var x = 0; x < grid.width; ++x) {
            for (var y = 0; y < grid.height; ++y) {
                var c = grid(x, y);
                if ((c !== ' ') && ! grid.isUsed(x, y)) {
                    svg += '<text text-anchor="middle" x="' + (x * SCALE) + '" y="' + (4 + y * SCALE * ASPECT) + '" style="fill:#000;">' + escapeHTMLEntities(c) +  '</text>';
                } // if
            } // y
        } // x
        svg += '</g>';
    }

    if (DEBUG_SHOW_SOURCE) {
        // Offset the characters a little for easier viewing
        svg += '<g transform="translate(2, 2)">\n';
        for (var x = 0; x < grid.width; ++x) {
            for (var y = 0; y < grid.height; ++y) {
                var c = grid(x, y);
                if (c !== ' ') {
                    svg += '<text text-anchor="middle" x="' + (x * SCALE) + '" y="' + (4 + y * SCALE * ASPECT) + '" style="fill:#F00;font-family:Menlo,monospace;font-size:12px;text-align:center">' + escapeHTMLEntities(c) +  '</text>';
                } // if
            } // y
        } // x
        svg += '</g>';
    } // if

    svg += '</g></svg>';

    return svg;
}


/* xcode.min.js */
var HIGHLIGHT_STYLESHEET = "<style>.hljs{display:block;overflow-x:auto;padding:0.5em;background:#fff;color:#000;-webkit-text-size-adjust:none}.hljs-comment{color:#006a00}.hljs-keyword,.hljs-literal,.nginx .hljs-title{color:#aa0d91}.method,.hljs-list .hljs-title,.hljs-tag .hljs-title,.setting .hljs-value,.hljs-winutils,.tex .hljs-command,.http .hljs-title,.hljs-request,.hljs-status,.hljs-name{color:#008}.hljs-envvar,.tex .hljs-special{color:#660}.hljs-string{color:#c41a16}.hljs-tag .hljs-value,.hljs-cdata,.hljs-filter .hljs-argument,.hljs-attr_selector,.apache .hljs-cbracket,.hljs-date,.hljs-regexp{color:#080}.hljs-sub .hljs-identifier,.hljs-pi,.hljs-tag,.hljs-tag .hljs-keyword,.hljs-decorator,.ini .hljs-title,.hljs-shebang,.hljs-prompt,.hljs-hexcolor,.hljs-rule .hljs-value,.hljs-symbol,.hljs-symbol .hljs-string,.hljs-number,.css .hljs-function,.hljs-function .hljs-title,.coffeescript .hljs-attribute{color:#1c00cf}.hljs-class .hljs-title,.smalltalk .hljs-class,.hljs-type,.hljs-typename,.hljs-tag .hljs-attribute,.hljs-doctype,.hljs-class .hljs-id,.hljs-built_in,.setting,.hljs-params,.clojure .hljs-attribute{color:#5c2699}.hljs-variable{color:#3f6e74}.css .hljs-tag,.hljs-rule .hljs-property,.hljs-pseudo,.hljs-subst{color:#000}.css .hljs-class,.css .hljs-id{color:#9b703f}.hljs-value .hljs-important{color:#ff7700;font-weight:bold}.hljs-rule .hljs-keyword{color:#c5af75}.hljs-annotation,.apache .hljs-sqbracket,.nginx .hljs-built_in{color:#9b859d}.hljs-preprocessor,.hljs-preprocessor *,.hljs-pragma{color:#643820}.tex .hljs-formula{background-color:#eee;font-style:italic}.diff .hljs-header,.hljs-chunk{color:#808080;font-weight:bold}.diff .hljs-change{background-color:#bccff9}.hljs-addition{background-color:#baeeba}.hljs-deletion{background-color:#ffc8bd}.hljs-comment .hljs-doctag{font-weight:bold}.method .hljs-id{color:#000}</style>";

return Object.freeze({
    format:               markdeepToHTML,
    formatDiagram:        diagramToSVG,
    stylesheet:           function() {
        return STYLESHEET + sectionNumberingStylesheet() + HIGHLIGHT_STYLESHEET;
    }
});

})();
