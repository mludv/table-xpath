/*globals jQuery:false _:false Node:false*/
(function ( $, _, window ) {

  var XPath = {};

  XPath.getXPath = function(element) {
    if (element && element.id)
      return '//*[@id="' + element.id + '"]';
    else
      return this.getTreeXPath(element);
  };


  /**
   * Gets an XPath for an element tree.
   */

  XPath.getTreeXPath = function(element) {
    var uniqueClasses, siblingClasses, classList, paths = [];

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType == 1; element = element.parentNode) {
      
      // Check if the element has an id
      if (element.id) {
       paths.splice(0, 0, '/*[@id="' + element.id + '"]');
       break;
      }

      uniqueClasses = null;
      classList = element.className.split(/\s+/);

      // Count siblings
      var index = 0;
      for (var sibling = element.previousSibling; sibling; 
           sibling = sibling.previousSibling) {
        // Ignore document type declaration.
        if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
          continue;

        if (sibling.nodeName == element.nodeName) {
          ++index;
          siblingClasses = sibling.className.split(/\s+/);
          var diff = _.difference(classList, siblingClasses);

          if (!uniqueClasses)
            uniqueClasses = diff;
          else
            uniqueClasses = _.intersection(diff, uniqueClasses);
        }
      }

      var pathIndex, tagName = element.nodeName.toLowerCase();
      if (uniqueClasses && uniqueClasses.length)
        pathIndex = '[@class="' + uniqueClasses[0] + '"]';
      else
        pathIndex = (index ? "[" + (index+1) + "]" 
                     : element.nextSibling ? "[" + 1 + "]" : "");
      paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join("/") : null;
  };


  (function($) {
    $.fn.getAttributes = function() {
      var attributes = { keys: [], values: [] }; 

      if(!this.length)
        return this;

      $.each(this[0].attributes, function(index, attr) {
        attributes.push({ key: attr.name, value: attr.value });
        attributes.keys.push(attr.name);
        attributes.values.push(attr.value);
      }); 

      return attributes;
    };
  })(jQuery);

  /**
  * Utility method for finding the first common ancestor for
  * a group of elements.
  */
  function commonAncestor(jnodes) {
      var i,
        nodes  = $.makeArray(jnodes),  
        node1  = nodes.pop(),
        method = "contains" in node1 ? "contains" : "compareDocumentPosition",
        test   = method === "contains" ? 1 : 0x0010;

      rocking:
      while (node1) {
        node1 = node1.parentNode;
        i     = nodes.length;    
        while (i--) {
          if ((node1[method](nodes[i]) & test) !== test)
            continue rocking;
        }
        return node1;
      }

      return null;
  }


  /**
  * Utility function that finds the parent among a list of elements.
  */
  var findParent = function(elements) {
    var out;

    $(elements).each(function() {
      var isParent = true;
      var element = this;
      $(elements).not(element).each(function() {
        if (!$(element).has(this).length) {
          isParent = false;
          return false;
        }
      });

      if (isParent) {
        out = element;
        return false;
      }
    });

    return out;
  };
  
  /**
   * Relative XPath. 
   * First we find the first element with
   * the text inside it. Then we construct a relative XPath to the other.
   */
  XPath.relativeXPath = function($rel, $target) {
    
    var rel = $rel[0], target = $target[0], paths = [];

    // Find Parent
    var parent = commonAncestor([rel, target]);
    if (!parent) return null;

    // Add the element we want the XPath to be relative to.
    paths.push('//' + rel.nodeName.toLowerCase() + '[contains(text(), "' + 
               $rel.text() + '")]');

    // Travel to the common parent.
    for (var el = rel; el !== parent && el; el = el.parentNode) {
      paths.push('..');
    }

    // Travel to parent from target and reverse
    var components = [];
    for (; target !== parent && target ; target = target.parentNode) {
      
      // Count siblings
      var index = 0;
      for (var sibling = target.previousSibling; sibling; 
           sibling = sibling.previousSibling) {
        // Ignore document type declaration.
        if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
          continue;

        if (sibling.nodeName == target.nodeName) {
          ++index;
        }
      }

      var pathIndex, tagName = target.nodeName.toLowerCase();
      pathIndex = (index ? "[" + (index+1) + "]" 
                     : target.nextSibling ? "[" + 1 + "]" : "");
      
      components.splice(0, 0, tagName + pathIndex);

    }

    
    return paths.concat(components).join('/')

  };

  XPath.getElementsByXPath = function(xpath, doc) {
    var nodes = [];

    try {
      
      var result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
      for (var item = result.iterateNext(); item; item = result.iterateNext()) {
        
        if (item.nodeType !== 1)
          item = item.parentNode || item.ownerElement;

        nodes.push(item);
      }
    }
    catch (ex) {
      // Invalid xpath expressions make their way here sometimes.  If that happens,
      // we still want to return an empty set without an exception.
    }

    return nodes;
  };


  $.fn.xpath = function () {
    return XPath.getXPath(this[0]);
  };

  $.xpath = function(xpath, document) {
    
    // If both args is a jquery element, we want to find the closest xpath
    // between them.
    var argIsElement = (xpath instanceof $) && (document instanceof $); 
    if (argIsElement) return XPath.relativeXPath(xpath, document);

    if (!document) document = window.document;
    var returns, elements = $(XPath.getElementsByXPath(xpath, document));
    
    if (!elements.length) return $([]);
    elements = $.unique(elements);
    var parent = findParent(elements);
    if (parent) return $(parent);
    else return  $(elements[0]); 

  };
  
}(jQuery, _, window));
