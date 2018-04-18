var listings = [{
    "address": "123 Fake Street",
    "unit": "456",
    "bedrooms": 2,
    "bathrooms": 1,
    "pets": []
  },
  {
    "address": "123 Fake Street",
    "unit": "789",
    "bedrooms": "Studio",
    "bathrooms": 1,
    "pets": ["dogs", "cats"]
  },
  {
    "address": "456 Fake Street",
    "unit": "0123",
    "bedrooms": 3,
    "bathrooms": 2.5,
    "pets": ["dogs"]
  }
];

var columns = ["address", "unit", "bedrooms", "bathrooms", "pets"];
var searchFilters = [];

var pressSearchNotification = document.getElementById("press-search-notification");

var filterSelectionBox = document.getElementById("filter-selection-box");
filterSelectionBox.style.visibility = "hidden";
var toggleSelectionFilterBox = function() {
	if (filterSelectionBox.style.visibility == "hidden") {
    	filterSelectionBox.style.visibility = "visible";
        
    }
    else
    {
    	filterSelectionBox.style.visibility = "hidden";
    }
};

var addFilterButton = document.getElementById("add-filter-button");
addFilterButton.addEventListener("click", toggleSelectionFilterBox);

var cancelFilterButton = document.getElementById("cancel-filter-button");
cancelFilterButton.addEventListener("click", toggleSelectionFilterBox);

var drawListings = function(listingsGiven) {
  var table = document.getElementById("listings-box");
  table.innerHTML = "";

  // Draw headers
  var headers = document.createElement("tr");
  for (i = 0; i < columns.length; i++) {
    var thisHeader = document.createElement("th");
    thisHeader.innerHTML = columns[i];
    headers.appendChild(thisHeader);
  }
  table.appendChild(headers);

  // Add the listings
  for (i = 0; i < listingsGiven.length; i++) {
    var thisListing = listingsGiven[i];
    var tableRow = document.createElement("tr");
    for (j = 0; j < columns.length; j++) {
      var thisCell = document.createElement("td");
      var thisColumn = columns[j];
      thisCell.innerHTML = thisListing[thisColumn].toString();
      tableRow.appendChild(thisCell);
    }
    table.appendChild(tableRow);
  }
};

var FilterForm = function(thisFilter) {

  this.drawOption = function(thisOption) {
    thisOption.tag = thisOption.tag || "";
    thisOption.choices = thisOption.choices || [];

    if (thisOption.choices.length && thisOption.tag != "")
      thisFilter.detailsBox.innerHTML += thisOption.tag + ": ";

    if (thisOption.choices.length == 0)
      this.drawCheckbox(thisOption);
    else if (thisOption.choices.length == 1)
      this.drawOtherTypeOfInput(thisOption);
    else if (thisOption.choices.length <= 3)
      this.drawRadioButtons(thisOption);
    else
      this.drawDropdown(thisOption);
  };

  this.drawWarnSpan = function(thisOption) {
    var warnSpan = document.createElement("span");
    warnSpan.className = "warn-span";
    warnSpan.id = thisOption.title;
    warnSpan.innerHTML = "&#9755;&nbsp;";
    thisFilter.detailsBox.appendChild(warnSpan);
  };

  this.drawCheckbox = function(thisOption) {
    thisOption.title = thisOption.title || thisOption.tag;
    thisOption.title = thisOption.title.replace(/[,\s]/gi, "");

    this.drawWarnSpan(thisOption);
    var choice = document.createElement("input");
    choice.setAttribute("type", "checkbox");
    choice.id = thisOption.title;
    choice.setAttribute("name", thisOption.title);
    // console.log("Input Default", thisOption.default);
    if (thisOption.default || thisOption.state) {
      choice.setAttribute("checked", true);
    }
    thisFilter.detailsBox.appendChild(choice);

    var choiceName = document.createElement("label");
    choiceName.setAttribute("for", thisOption.title);
    choiceName.innerHTML = thisOption.tag;
    thisFilter.detailsBox.appendChild(choiceName);

  };

  this.drawRadioButtons = function(thisOption) {
    thisOption.title = thisOption.title || thisOption.choices.toString();
    thisOption.title = thisOption.title.replace(/[,\s]/gi, "");

    this.drawWarnSpan(thisOption);

    for (j = 0; j < thisOption.choices.length; j++) {
      var thisChoice = thisOption.choices[j];
      var choice = document.createElement("input");
      choice.setAttribute("type", "radio");
      choice.setAttribute("name", thisOption.title);
      choice.setAttribute("value", thisChoice);
      choice.id = thisChoice;
      var isDefault = (thisChoice == thisOption.default);
      var isState = (thisChoice == thisOption.state);
      var stateExists = ("state" in thisOption);
      if ((!stateExists && isDefault) || (stateExists && isState)) {
        choice.setAttribute("checked", true);
      }
      thisFilter.detailsBox.appendChild(choice);

      choiceName = document.createElement("label");
      choiceName.setAttribute("for", thisChoice);
      choiceName.innerHTML = thisChoice;
      thisFilter.detailsBox.appendChild(choiceName);

    }
    thisFilter.detailsBox.innerHTML += "<br/>";

  };

  this.drawDropdown = function(thisOption) {
    thisOption.title = thisOption.title || thisOption.tag;
    thisOption.title = thisOption.title.replace(/[,\s]/gi, "");

    this.drawWarnSpan(thisOption);

    var choice;
    var dropDown = document.createElement("select");
    dropDown.setAttribute("name", thisOption.title);
    if (!thisOption.default && !thisOption.state) {
      choice = document.createElement("option");
      choice.innerHTML = "Select an option";
      dropDown.appendChild(choice);
    }
    for (j = 0; j < thisOption.choices.length; j++) {
      var thisChoice = thisOption.choices[j];
      choice = document.createElement("option");
      choice.setAttribute("id", thisChoice);

      var isDefault = (thisChoice == thisOption.default);
      var isState = (thisChoice == thisOption.state);
      var stateExists = ("state" in thisOption);
      if ((!stateExists && isDefault) || (stateExists && isState)) {
        choice.setAttribute("selected", true);
      }

      choice.innerHTML = thisChoice;
      dropDown.appendChild(choice);
    }
    thisFilter.detailsBox.appendChild(dropDown);
    thisFilter.detailsBox.innerHTML += "<br/>";

  };

  this.drawOtherTypeOfInput = function(thisOption) {
    thisOption.title = thisOption.title || thisOption.tag;
    thisOption.title = thisOption.title.replace(/[,\s]/gi, "");

    this.drawWarnSpan(thisOption);

    var inputType = thisOption.choices[0].match(/\[.*\]/i)[0].replace(/[\[|\]]/g, "");

    var inputHTML = document.createElement("input");
    inputHTML.setAttribute("type", inputType);
    inputHTML.setAttribute("name", thisOption.title);

    if (thisOption.state)
      inputHTML.setAttribute("value", thisOption.state);

    thisFilter.detailsBox.appendChild(inputHTML);
    thisFilter.detailsBox.innerHTML += "<br/>";

  };

  this.toggleView = function() {
    if (thisFilter.detailsBox.style.display == "none") {
      thisFilter.detailsBox.style.display = "block";
      thisFilter.validate();
    } else {
      thisFilter.detailsBox.style.display = "none";
      console.log("searchFilters, if you're interested:", searchFilters);
    }

  };

  this.validate = function() {
    thisFilter.missingNames = [];
    var filterBoxId = "#" + thisFilter.name;

    var thisFilterForm = this;
    var removeFromMissing = function(nameFound) {
      var index = thisFilter.missingNames.indexOf(nameFound);
      if (index !== -1)
        thisFilter.missingNames.splice(index, 1);
    };

    var findOptionWithTitle = function(str) {
      var whereOptionEquals = function(opt) {
        return opt.title == str;
      };
      return thisFilter.options.find(whereOptionEquals, undefined, str);
    };

    var checkboxes = document.querySelectorAll(filterBoxId + " input[type='checkbox']");
    for (i = 0; i < checkboxes.length; i++) {
      var thisCheckbox = checkboxes[i];
      findOptionWithTitle(thisCheckbox.name).state = thisCheckbox.checked;
    }

    var texts = document.querySelectorAll(filterBoxId + " input[type='text']");
    for (i = 0; i < texts.length; i++) {
      var thisText = texts[i];
      findOptionWithTitle(thisText.name).state = thisText.value;
    }

    var radioButtons = document.querySelectorAll(filterBoxId + " input[type='radio']");
    for (i = 0; i < radioButtons.length; i++) {
      var thisRB = radioButtons[i];
      var theOption = findOptionWithTitle(thisRB.name);
      if (thisRB.checked) {
        theOption.state = thisRB.value;
        removeFromMissing(thisRB.name);
      } else if (!("state" in theOption) && !thisFilter.missingNames.includes(thisRB.name)) {
        thisFilter.missingNames.push(thisRB.name);
      }

    }

    var dropDowns = document.querySelectorAll(filterBoxId + " select");
    for (i = 0; i < dropDowns.length; i++) {
      var thisDropDown = dropDowns[i];
      if (thisDropDown.value != "Select an option")
        findOptionWithTitle(thisDropDown.name).state = thisDropDown.value;
      else
        thisFilter.missingNames.push(thisDropDown.name);
    }

    // Hide them all
    var warnSpans = document.querySelectorAll(filterBoxId + " .warn-span");
    for (i = 0; i < warnSpans.length; i++) {
      warnSpans[i].style.display = "none";
    }

    var addButton = document.querySelector(filterBoxId + " .add-button");
    if (!thisFilter.missingNames.length) {
      thisFilter.validated = true;
      addButton.removeAttribute("disabled", false);
    } else {
      thisFilter.validated = false;
      addButton.setAttribute("disabled", "");

      for (i = 0; i < thisFilter.missingNames.length; i++) {
        var warnSpan = document.querySelector(filterBoxId + " .warn-span#" + thisFilter.missingNames[i]);
        warnSpan.style.display = "inline";
      }
    }

  };

  // form builder initializes
  thisFilter.detailsBox = document.createElement("form");
  thisFilter.detailsBox.className = "filter-details";
  thisFilter.detailsBox.setAttribute("method", "POST");
  thisFilter.detailsBox.style.display = "none";

  for (i = 0; i < thisFilter.options.length; i++) {
    this.drawOption(thisFilter.options[i]);
  }

  var addButton = document.createElement("button");
  addButton.setAttribute("type", "button");
  addButton.className = "add-button";
  addButton.innerHTML = "Add this filter";
  addButton.setAttribute("disabled", "");
  addButton.addEventListener("click", thisFilter.add, false);
  thisFilter.detailsBox.appendChild(addButton);

};

var SearchFilter = function(name) {
  var thisFilter = this;
  var usedFilters = document.getElementById("used-filters");
  var unusedFilters = document.getElementById("unused-filters");

  this.name = name || "";
  this.selected = false;
  this.validated = false;
  this.added = false;
  this.priority = 0;

  this.add = function() {
    toggleSelectionFilterBox();

    thisFilter.selected = true;
    unusedFilters.removeChild(thisFilter.box);
    delete thisFilter.box;
    thisFilter.drawSelection();
  };

  this.remove = function() {
    thisFilter.selected = false;
    usedFilters.removeChild(thisFilter.display);
    delete thisFilter.display;
    thisFilter.drawBox();
  };

  this.drawSelection = function() {
    this.display = document.createElement("div");
    this.display.id = this.name + "-selected";
    this.display.className = "rounded-border selectedFilter";
    this.display.addEventListener("click", this.remove);
    this.display.innerHTML += "<b>" + thisFilter.name + "</b><br/>";

    for (i = 0; i < thisFilter.options.length; i++) {

      var thisOption = thisFilter.options[i];

      // Different types of text for different types of input
      if (thisOption.state == false) {
        var unchecked = document.createElement("span");
        unchecked.className = "strikeThrough";
        unchecked.innerHTML += thisOption.tag;
        this.display.appendChild(unchecked);
      } else if (thisOption.state == true)
        this.display.innerHTML += thisOption.tag + "<br/>";
      else if (thisOption.tag == "") {
        this.display.innerHTML += thisOption.state + "<br/>";
      } else {
        this.display.innerHTML += thisOption.tag + ": " + thisOption.state + "<br/>";
      }

    }
    var usedFilters = document.getElementById("used-filters");
    usedFilters.appendChild(this.display);
  };

  this.drawBox = function() {
    this.box = document.createElement("div");
    this.box.id = this.name;
    this.box.className = "search-filter rounded-border";

    this.nameBox = document.createElement("span");
    this.nameBox.innerHTML = this.name;

    this.form = new FilterForm(this);
    this.validate = this.form.validate;
    this.nameBox.addEventListener("click", this.form.toggleView);
    this.detailsBox.addEventListener("change", this.validate);

    this.box.appendChild(this.nameBox);
    this.box.appendChild(this.detailsBox);
    var unusedFilters = document.getElementById("unused-filters");
    unusedFilters.appendChild(this.box);
  };

  searchFilters[name] = this;
};

drawListings(listings);

// Bedroom example, no defaults
var bedrooms = new SearchFilter("bedrooms");
bedrooms.options = [{
    "tag": "Number of beds",
    "choices": ["Studio", "Convertible", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  {
    "tag": "",
    "choices": ["Exactly", "Or More", "Or Less"]
  },
  {
    "tag": "True"
  }
];

// Bathroom example, all defaults
var bathrooms = new SearchFilter("bathrooms");
bathrooms.options = [{
    "tag": "# of baths",
    "default": 1,
    "choices": [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
  },
  {
    "default": "Exactly",
    "choices": ["Exactly", "Or More", "Or Less"]
  },
  {
    "tag": "Something Idk"
  }
];

var rent = new SearchFilter("rent");
rent.options = [{
    "tag": "minimum",
    "choices": ["[TEXT]"]
  },
  {
    "tag": "maximum",
    "choices": ["[TEXT]"]
  }
];

// Run all the basic filters' draw box functions
var runDrawBox = function(filterGiven) {
  filterGiven.drawBox();
};
Object.values(searchFilters).forEach(runDrawBox);
