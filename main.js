function createAndAppendElement(targetNode, className, textContent) {
    let newElement = document.createElement('span');
    newElement.className = className;
    newElement.appendChild(document.createTextNode(textContent));
    targetNode.appendChild(newElement);
    return newElement;
}

function insertLineBreak(targetNode) {
    targetNode.appendChild(document.createElement('br'));
}

function insertIndentation(targetNode, indentationLevel, tabSize) {
    createAndAppendElement(targetNode, '', ' '.repeat(indentationLevel * tabSize));
}

function insertOpeningTag(targetNode, tagName, attributeNames, attributeValues, tagId) {
    for (tag of tagName) {
        if (tagId === "") {
            createAndAppendElement(targetNode, 'tag', tag);    
        } else {
            createAndAppendElement(targetNode, 'tag tag-' + tagId, tag);
        }
    }
    // make attributeValues and attributeNames from regexIterables into lists so that i can map them.
    let attributeNamesList = [];
    let attributeValuesList = [];
    for (attribute of attributeNames) {
        attributeNamesList.push(attribute);
    }
    for (value of attributeValues) {
        attributeValuesList.push(value);
    }
    let attributesMap = attributeNamesList.map((key, value) => {
        return [key, attributeValuesList[value]];
    });
    for (attribute of attributesMap) {
        createAndAppendElement(targetNode, 'attribute', attribute[0]);
        createAndAppendElement(targetNode, 'value', attribute[1]);
    }
    if (tagId === "") {
        createAndAppendElement(targetNode, 'tag', '>');
    } else {
        createAndAppendElement(targetNode, 'tag tag-' + tagId, '>');
    }
}

function validTag(tagName) {
    const validTags = ["html", "head", "script", "title", "body", "div", "p",
                       "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
                       "table", "tr", "td", "form", "option", "button", "select", "textarea",
                       "a", "strong", "em", "span", "code", "meta", "link", "br", "input"];
    for (tag of validTags) {
        if (tagName.includes(tag)) {
            return true;
        }
    }
    return false;
}

function singleTag(tagName) {
    if(tagName.includes('meta')  ||
       tagName.includes('br')    ||
       tagName.includes('input') ||
       tagName.includes('link')) {
        return true;
    }
    return false;
}

document.getElementById('submit').addEventListener('click', () => {
    const html = document.getElementById('source').value;
    const target = document.getElementById('target');
    target.textContent = "";
    const matches = html.matchAll(/<[a-zA-Z]+(>|.*?[^?]>)|(?<=>)[\w ?.,;:!]+(?=<)|<\/\w*>/g);
    let tokenizedhtml = [];
    for (const match of matches) {
        tokenizedhtml.push(match[0]);
    }
    let indentationLevel = 0;
    let elemStack = [];
    const tabSize = 4;
    let tagId = 0;
    for (let i = 0; i < tokenizedhtml.length; i++) {
        // opening tag
        if (/<[a-zA-Z]+(>|.*?[^?]>)/.test(tokenizedhtml[i])) {
            if (!validTag(tokenizedhtml[i])) {
                target.textContent = `Not valid HTML! Unknown tag: ${tokenizedhtml[i]}`;
                return;
            }
            if (!singleTag(tokenizedhtml[i])) {
                elemStack.push([tokenizedhtml[i],tagId]);
                tagId++;
            }
            const tagName = tokenizedhtml[i].matchAll(/<[a-zA-Z0-9]+/g);
            const attributeNames = tokenizedhtml[i].matchAll(/[ ][\w-]+(?=[^<]*>)=/g);
            const attributeValues = tokenizedhtml[i].matchAll(/".*?"/g);
            // check what category the next token will be
            // end of array
            if (i === tokenizedhtml.length - 1) {
                insertOpeningTag(target, tagName, attributeNames, attributeValues, tagId);
            }
            // opening tag
            else if (/<[a-zA-Z]+(>|.*?[^?]>)/.test(tokenizedhtml[i + 1])) {
                if (singleTag(tokenizedhtml[i])) {
                    insertOpeningTag(target, tagName, attributeNames, attributeValues, "");
                    insertLineBreak(target);
                    insertIndentation(target, indentationLevel, tabSize);
                } else {
                    insertOpeningTag(target, tagName, attributeNames, attributeValues, tagId);
                    indentationLevel++;
                    insertLineBreak(target);
                    insertIndentation(target, indentationLevel, tabSize);
                }
            }
            // text
            else if (!(/<[a-zA-Z]+(>|.*?[^?]>)/.test(tokenizedhtml[i + 1])) &&
                     !(/<\/\w*>/.test(tokenizedhtml[i + 1]))) {
                insertOpeningTag(target, tagName, attributeNames, attributeValues, tagId);
            }
            // ending tag
            else if (/<\/\w*>/.test(tokenizedhtml[i + 1])) {
                insertOpeningTag(target, tagName, attributeNames, attributeValues, tagId);
            }
        }
        // text
        else if (!(/<[a-zA-Z]+(>|.*?[^?]>)/.test(tokenizedhtml[i])) &&
                 !(/<\/\w*>/.test(tokenizedhtml[i]))) {
            // check what category the next token will be
            // end of array
            if (i === tokenizedhtml.length - 1) {
                createAndAppendElement(target, 'text', tokenizedhtml[i]);
            }
            // opening tag
            else if (/<[a-zA-Z]+(>|.*?[^?]>)/.test(tokenizedhtml[i + 1])) {
                createAndAppendElement(target, 'text', tokenizedhtml[i]);
                insertLineBreak(target);
                insertIndentation(target, indentationLevel, tabSize);
            }
            // ending tag
            else if (/<\/\w*>/.test(tokenizedhtml[i + 1])) {
                createAndAppendElement(target, 'text', tokenizedhtml[i]);
            }
        }
        // ending tag
        else if (/<\/\w*>/.test(tokenizedhtml[i])) {
            if (!validTag(tokenizedhtml[i])) {
                target.textContent = `Not valid HTML! Unknown tag: ${tokenizedhtml[i]}`;
                return;
            }
            let endingTagId = elemStack[elemStack.length - 1][1] + 1;
            // check for its opening pair
            if (tokenizedhtml[i].includes(elemStack[elemStack.length - 1][0].replace(/[ ][\w-]+(?=[^<]*>)/g,'')
                                                                            .replace(/=[\'"]?((?:(?!\/>|>|"|\'|\s).)+)/g,'')
                                                                            .replace('<','')
                                                                            .replace('>','')
                                                                            .replace('"','')
                                                                            .replace('"',''))) {
                elemStack.pop();
            } else {
                target.textContent = `Not valid HTML! No pair for ${elemStack[elemStack.length - 1][0]}!`;
                return;
            }
            // check what category the next token will be
            // end of array
            if (i === tokenizedhtml.length - 1) {
                createAndAppendElement(target, 'tag tag-' + endingTagId, tokenizedhtml[i]);
            }
            // opening tag
            else if (/<[a-zA-Z]+(>|.*?[^?]>)/.test(tokenizedhtml[i + 1])) {
                createAndAppendElement(target, 'tag tag-' + endingTagId, tokenizedhtml[i]);
                insertLineBreak(target);
                insertIndentation(target, indentationLevel, tabSize);
            }
            // text
            else if (!(/<[a-zA-Z]+(>|.*?[^?]>)/.test(tokenizedhtml[i + 1])) &&
                     !(/<\/\w*>/.test(tokenizedhtml[i + 1]))) {
                createAndAppendElement(target, 'tag tag-' + endingTagId, tokenizedhtml[i]);
                insertLineBreak(target);
                insertIndentation(target, indentationLevel, tabSize);
            }
            // ending tag
            else if (/<\/\w*>/.test(tokenizedhtml[i + 1])) {
                createAndAppendElement(target, 'tag tag-' + endingTagId, tokenizedhtml[i]);
                indentationLevel--;
                insertLineBreak(target);
                insertIndentation(target, indentationLevel, tabSize);
            }
        }
    }
    // add event listeners
    let tags = target.querySelectorAll('.tag');
    for (tag of tags) {
        tag.addEventListener('mouseover', (event) => {
            let nodeParts = target.querySelectorAll('.' + event.target.classList[1]);
            for (nodePart of nodeParts) {
                nodePart.classList.add('highlight');
            }
        });
        tag.addEventListener('mouseleave', (event) => {
            let nodeParts = target.querySelectorAll('.' + event.target.classList[1]);
            for (nodePart of nodeParts) {
                nodePart.classList.remove('highlight');
            }
        });
    }
});