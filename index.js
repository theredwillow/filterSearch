var columns = ["address", "unit", "bedrooms", "bathrooms", "pets"];
var searchFilters = {};

var sortFilters = function() {
    var unselectedFilters = document.getElementById("unselected-filters");

    var priorityGroups = {};
    var groupByPriority = function(thisFilterName)
    {
        var thisFilter = searchFilters[thisFilterName];
        var thisPriority = thisFilter.priority || 0;
        if ( thisFilter.selected )
            return;
        unselectedFilters.removeChild(thisFilter.box);
        if( !(thisFilter.priority in priorityGroups) )
            priorityGroups[ thisPriority ] = [];
        priorityGroups[ thisPriority ].push(thisFilter);
    };
    Object.keys(searchFilters).forEach(groupByPriority);

    var priorities = Object.keys(priorityGroups).reverse();
    var addBack = function(thisFilter)
    {
        unselectedFilters.appendChild(thisFilter.box);
    };
    var loopThruPriority = function(thisPriority)
    {
        var theseFilters = priorityGroups[thisPriority];
        theseFilters.forEach(addBack);
    };
    priorities.forEach(loopThruPriority);

};

var pressSearchNotification = document.getElementById("press-search-notification");
var notifyToPressSearch = function() {
    var warnToPressSearch = "hidden";

    var checkIfStatesMatch = function(thisOptionName) {
        var optionState = thisFilter.options[thisOptionName].state || "";
        var scState = optionSC[thisOptionName] || "";
        if (optionState != scState)
            warnToPressSearch = "visible";
    };

    var searchFilterNames = Object.keys(searchFilters);
    for (i = 0; i < searchFilterNames.length; i++) {
        var thisFilter = searchFilters[searchFilterNames[i]];

        if (thisFilter.selected) {
            var optionSC = searchCriteria[searchFilterNames[i]];
            if (optionSC)
                Object.keys(thisFilter.options).forEach(checkIfStatesMatch);
            else {
                warnToPressSearch = "visible";
            }
        }

        if (warnToPressSearch == "visible")
            break;

    }

    var searchCriteriaNames = Object.keys(searchCriteria);
    for (i = 0; i < searchCriteriaNames.length; i++) {
        var thisSC = searchCriteria[searchCriteriaNames[i]];
        if (!searchFilters[searchCriteriaNames[i]].selected) {
            warnToPressSearch = "visible";
            break;
        }
    }

    pressSearchNotification.style.visibility = warnToPressSearch;

};

var filterSelectionBox = document.getElementById("filter-selection-box");
filterSelectionBox.style.visibility = "hidden";
var toggleSelectionFilterBox = function() {
    if (filterSelectionBox.style.visibility == "hidden")
    {
        filterSelectionBox.style.visibility = "visible";
        filterSearchBar.focus();
    }
    else
        filterSelectionBox.style.visibility = "hidden";
};

var filterSearchBar = document.getElementById("filter-search");
var WordHelper = function() {
    var thisWordHelper = this;

	this.history = {
    	
    };

    this.checkWord = function(field) {
        var str = filterSearchBar.value;
        var re = new RegExp(field, "gi");
        if ( re.test(str) ) {
        	return true;
        }
        else
            return false;
    };

    this.update = function(thisFilter) {
    	if (thisFilter.selected)
        	return;
    	thisFilter.priority = thisFilter.priority++ || 1;
        thisFilter.form.openView();
        if (!thisWordHelper.history[thisFilter.name]) {
            thisWordHelper.history[thisFilter.name] = thisFilter;
            console.log("Added one, new history:", thisWordHelper.history);
        }
    };

	this.reset = function(filterName) {
    	var filterInHistory = thisWordHelper.history[filterName];
        // console.log( "Reset check:", filterInHistory, searchFilters[filterName]);
        if (filterInHistory) {
            console.log("Reseting", filterName);
    	    searchFilters[filterName] = filterInHistory;
            delete thisWordHelper.history[filterName];
        }
    };

    this.checkFilters = function(e) {
        var searchFilterNames = Object.keys(searchFilters);
        // console.log("searchFilterNames", searchFilterNames);
        for (a = 0; a < searchFilterNames.length; a++) {
            var thisFilterName = searchFilterNames[a];
            // console.log("thisFilterName", a, thisFilterName);
            var thisFilter = searchFilters[thisFilterName];
            if (thisWordHelper.checkWord(thisFilterName))
                thisWordHelper.update(thisFilter);
            else
                thisWordHelper.reset(thisFilter.name);

            var theseOptionNames = Object.keys(thisFilter.options);
            for (b = 0; b < theseOptionNames.length; b++) {
                var thisOptionName = theseOptionNames[b];
                var thisOption = thisFilter.options[thisOptionName];
                if (thisOption.tag && thisWordHelper.checkWord(thisOption.tag))
                    thisWordHelper.update(thisFilter);
                else
                    thisWordHelper.reset(thisFilter.name);

                var theseChoices = thisOption.choices;
                if( theseChoices.length == 1 ) {
                	// console.log("Skipping this, [] possible");
                	continue; // Handles [TEXT] matches
                }
                for (c = 0; c < theseChoices.length; c++) {
                    var thisChoice = theseChoices[c];
                    if (thisWordHelper.checkWord(thisChoice)) {
                        
                        thisWordHelper.update(thisFilter);
                        
                        var query = "#" + thisFilter.name + " [name='" + thisChoice + "'],[id='"+ thisChoice +"']";
                        // console.log("query", query);
                        var htmlElement = document.querySelector(query);
                        htmlElement.setAttribute("selected", "");
                        htmlElement.setAttribute("checked", "");
                        thisFilter.validate();

                    }
                    else
                        thisWordHelper.reset(thisFilter.name);
                }
            }
        }
    };
};
var wordHelper = new WordHelper();
filterSearchBar.addEventListener("keyup", wordHelper.checkFilters);

var addFilterButton = document.getElementById("add-filter-button");
addFilterButton.addEventListener("click", toggleSelectionFilterBox);

var cancelFilterButton = document.getElementById("cancel-filter-button");
cancelFilterButton.addEventListener("click", toggleSelectionFilterBox);

var FilterForm = function(thisFilter) {

    this.drawOption = function(thisOptionName) {
        var thisOption = thisFilter.options[thisOptionName];
        thisOption.title = thisOptionName;
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
            var stateExists = thisOption.state;
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
            choice.setAttribute("name", thisChoice);

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
            thisFilter.form.openView();
        } else {
            thisFilter.detailsBox.style.display = "none";
        }

    };

	this.openView = function() {
    	thisFilter.detailsBox.style.display = "block";
        thisFilter.validate();
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

        var checkboxes = document.querySelectorAll(filterBoxId + " input[type='checkbox']");
        for (i = 0; i < checkboxes.length; i++) {
            var thisCheckbox = checkboxes[i];
            thisFilter.options[thisCheckbox.name].state = thisCheckbox.checked;
        }

        var texts = document.querySelectorAll(filterBoxId + " input[type='text']");
        for (i = 0; i < texts.length; i++) {
            var thisText = texts[i];
            thisFilter.options[thisText.name].state = thisText.value;
        }

        var radioButtons = document.querySelectorAll(filterBoxId + " input[type='radio']");
        for (i = 0; i < radioButtons.length; i++) {
            var thisRB = radioButtons[i];
            var theOption = thisFilter.options[thisRB.name];
            if (thisRB.checked) {
                theOption.state = thisRB.value;
                removeFromMissing(thisRB.name);
            } else if (!theOption.state && !thisFilter.missingNames.includes(thisRB.name)) {
                thisFilter.missingNames.push(thisRB.name);
            }

        }

        var dropDowns = document.querySelectorAll(filterBoxId + " select");
        for (i = 0; i < dropDowns.length; i++) {
            var thisDropDown = dropDowns[i];
            if (thisDropDown.value != "Select an option")
                thisFilter.options[thisDropDown.name].state = thisDropDown.value;
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

    var thisForm = this;
    var drawAnOption = function(thisOptionName) {
        thisForm.drawOption(thisOptionName);
    }
    Object.keys(thisFilter.options).forEach(drawAnOption);


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
    var selectedFilters = document.getElementById("selected-filters");
    var unselectedFilters = document.getElementById("unselected-filters");

    this.name = name || "";
    this.selected = false;
    this.validated = false;

    this.add = function() {
        toggleSelectionFilterBox();

        thisFilter.selected = true;
        thisFilter.drawSelected();
        notifyToPressSearch();
    };

    this.remove = function() {
        thisFilter.selected = false;
        thisFilter.priority = 100;
        thisFilter.drawUnselected();
        sortFilters();
        delete thisFilter.priority;
        thisFilter.form.openView();
        notifyToPressSearch();
    };

    this.drawUsed = function() {
        this.display = document.createElement("div");
        this.display.id = this.name + "-used";
        this.display.className = "rounded-border usedFilter";
        this.display.innerHTML += "<b>" + thisFilter.name + "</b><br/>";

        var drawAnOption = function(optionName) {
            var thisOption = thisFilter.options[optionName];
            if (!thisOption.state) {
                var unchecked = document.createElement("span");
                unchecked.className = "strikeThrough";
                unchecked.innerHTML += thisOption.tag;
                thisFilter.display.appendChild(unchecked);
            } else if (thisOption.state == true)
                thisFilter.display.innerHTML += thisOption.tag + "<br/>";
            else if (thisOption.tag == "")
                thisFilter.display.innerHTML += thisOption.state + "<br/>";
            else
                thisFilter.display.innerHTML += thisOption.tag + ": " + thisOption.state + "<br/>";

        }
        Object.keys(thisFilter.options).forEach(drawAnOption);

        var usedFilters = document.getElementById("used-filters");
        usedFilters.appendChild(this.display);
    };

    this.drawSelected = function() {
    
        if (thisFilter.box) {
            unselectedFilters.removeChild(thisFilter.box);
            delete thisFilter.box;
        }
    
        this.display = document.createElement("div");
        this.display.id = this.name + "-selected";
        this.display.className = "rounded-border selectedFilter";
        this.display.addEventListener("click", this.remove);
        this.display.innerHTML += "<b>" + thisFilter.name + "</b><br/>";

        var drawAnOption = function(thisOptionName) {

            var thisOption = thisFilter.options[thisOptionName];

            if (!thisOption.state) {
                var unchecked = document.createElement("span");
                unchecked.className = "strikeThrough";
                unchecked.innerHTML += thisOption.tag;
                thisFilter.display.appendChild(unchecked);
            } else if (thisOption.state == true)
                thisFilter.display.innerHTML += thisOption.tag + "<br/>";
            else if (thisOption.tag == "") {
                thisFilter.display.innerHTML += thisOption.state + "<br/>";
            } else {
                thisFilter.display.innerHTML += thisOption.tag + ": " + thisOption.state + "<br/>";
            }

        }
        Object.keys(thisFilter.options).forEach(drawAnOption);

        var selectedFilters = document.getElementById("selected-filters");
        selectedFilters.appendChild(this.display);
    };

    this.drawUnselected = function() {
    
        if (thisFilter.display) {
            selectedFilters.removeChild(thisFilter.display);
            delete thisFilter.display;
        }
    
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
        var unselectedFilters = document.getElementById("unselected-filters");
        unselectedFilters.appendChild(this.box);
    };

    searchFilters[name] = this;
};

// Bedroom example, no defaults
var bedrooms = new SearchFilter("bedrooms");
bedrooms.options = {
    "numOfBeds": {
        "tag": "Number of beds",
        "choices": ["Studio", "Convertible", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    numOfBaths: {
        "tag": "",
        "choices": ["Exactly", "Or More", "Or Less"]
    }
};

// Bathroom example, all defaults
var bathrooms = new SearchFilter("bathrooms");
bathrooms.options = {
    "numOfBaths": {
        "tag": "# of baths",
        "default": 1,
        "choices": [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
    },
    "moreOrLess": {
        "default": "Exactly",
        "choices": ["Exactly", "Or More", "Or Less"]
    }
};

var rent = new SearchFilter("rent");
rent.options = {
    "min": {
        "tag": "minimum",
        "choices": ["[TEXT]"]
    },
    "max": {
        "tag": "maximum",
        "choices": ["[TEXT]"]
    }
};

var searchCriteria = {
    "rent": {
        "min": 2000
    }
};

// Run all the basic filters' draw box functions
var runDrawBoxes = function(filterGiven) {

    if (searchCriteria[filterGiven.name]) {
        var setState = function(thisChoiceName) {
            searchFilters[filterGiven.name].options[thisChoiceName].state = searchCriteria[filterGiven.name][thisChoiceName];
        };
        Object.keys(searchCriteria[filterGiven.name]).forEach(setState);
        filterGiven.drawUsed();
        filterGiven.selected = true;
    }

    if (!filterGiven.selected)
        filterGiven.drawUnselected();
    else
        filterGiven.drawSelected();
};
Object.values(searchFilters).forEach(runDrawBoxes);
