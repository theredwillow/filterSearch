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
        if (searchFilters[searchCriteriaNames[i]] && !searchFilters[searchCriteriaNames[i]].selected) {
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

	this.history = { };

    this.checkWord = function(field) {
        var str = filterSearchBar.value;
        var re = new RegExp(field, "gi");
        thisWordHelper.matchingField = field;
        return re.test(str);
    };

    this.update = function(thisFilter) {
    	if (thisFilter.selected)
        	return;
    	thisFilter.priority = thisFilter.priority++ || 1;
        thisFilter.form.openView();

        // Add to history in case you need to reset it later
        if (!thisWordHelper.history[thisFilter.id]) {
            thisWordHelper.history[thisFilter.id] = JSON.parse(JSON.stringify(thisFilter)); // You have to do this JSON stuff to break the reference
            thisWordHelper.history[thisFilter.id].matchingFields = [ thisWordHelper.matchingField ];
        }
        else if ( !thisWordHelper.history[thisFilter.id].matchingFields.includes(thisWordHelper.matchingField) )
            thisWordHelper.history[thisFilter.id].matchingFields.push( thisWordHelper.matchingField );

        delete thisWordHelper.matchingField;
    };

	this.reset = function(filterName, check) {
    	var filterInHistory = thisWordHelper.history[filterName];
        if ( filterInHistory && (check || filterInHistory.matchingFields.includes(thisWordHelper.matchingField)) ) {
            var optionNamesInHistory = Object.keys(filterInHistory.options);
            for (i = 0; i < optionNamesInHistory.length; i++) {
                var stateInHistory = filterInHistory.options[ optionNamesInHistory[i] ].state;
                if (stateInHistory) {
                    searchFilters[filterName].form.changeChoice(stateInHistory);
                }
            }
            searchFilters[filterName].validate();
            delete thisWordHelper.history[filterName];
        }
        delete thisWordHelper.matchingFields;
    };

    this.checkFilters = function(e) {

        if ( e.keyCode == 13 ) {
            thisWordHelper.add();
            return;
        }

        var searchFilterNames = Object.keys(searchFilters);
        // console.log("searchFilterNames", searchFilterNames);
        for (a = 0; a < searchFilterNames.length; a++) {
            var thisFilterName = searchFilterNames[a];
            // console.log("thisFilterName", a, thisFilterName);
            var thisFilter = searchFilters[thisFilterName];
            if (thisWordHelper.checkWord(thisFilterName))
                thisWordHelper.update(thisFilter);
            else
                thisWordHelper.reset(thisFilter.id);

            var theseOptionNames = Object.keys(thisFilter.options);
            for (b = 0; b < theseOptionNames.length; b++) {
                var thisOptionName = theseOptionNames[b];
                var thisOption = thisFilter.options[thisOptionName];
                if (thisOption.tag && thisWordHelper.checkWord(thisOption.tag))
                    thisWordHelper.update(thisFilter);
                else
                    thisWordHelper.reset(thisFilter.id);

                var theseChoices = thisOption.choices;
                if( theseChoices.length == 1 ) {
                	// console.log("Skipping this, [] possible");
                	continue; // Handles [TEXT] matches
                }
                for (c = 0; c < theseChoices.length; c++) {
                    var thisChoice = theseChoices[c];
                    if (thisWordHelper.checkWord(thisChoice)) {
                        thisWordHelper.update(thisFilter);
                        thisFilter.form.changeChoice(thisChoice);
                    }
                    else
                        thisWordHelper.reset(thisFilter.id);
                }
            }
        }
    };

    this.add = function() {
        var lengthChecker = 0;
        var bestMatches = [];
        var namesInHistory = Object.keys(thisWordHelper.history);
        for (i = 0; i < namesInHistory.length; i++) {
            var thisName = namesInHistory[i];
            var thisLength = thisWordHelper.history[ thisName ].matchingFields.length;
            if (thisLength > lengthChecker) {
                lengthChecker = thisLength;
                bestMatches = [ thisName ];
            }
            else if ( thisLength == lengthChecker )
                bestMatches.push(thisName);
        }
        if ( bestMatches.length == 1 ) {
            if ( searchFilters[ bestMatches[0] ].validated ) {
                filterSearchBar.value = "";
                delete thisWordHelper.history[ bestMatches[0] ];
                Object.keys( thisWordHelper.history ).forEach(function(tF){ thisWordHelper.reset(tF, true); });
                searchFilters[ bestMatches[0] ].add();
            }
            else
                console.log( "You can't submit this yet, you still need", searchFilters[ bestMatches[0] ].missingNames );
        }
        else
            console.log("Sorry, no obvious selections. You still need to pick between", bestMatches);
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

    this.changeChoice = function(choice) {

        // Find the choice
        var query = "#" + thisFilter.id + " [name='" + choice + "']";
        query += ", #" + thisFilter.id + " [id='" + choice +"']";
        // console.log("query", query);
        var htmlElement = document.querySelector(query);

        // Undo the current selected or checked option
        var children = htmlElement.parentElement.children;
        for (i = 0; i < children.length; i++) {
            var thisChild = children[i];
            thisChild.removeAttribute("selected");
            thisChild.removeAttribute("checked");
        }

        // Set the choice
        htmlElement.setAttribute("selected", "");
        htmlElement.setAttribute("checked", "");

        thisFilter.validate();

    };

    this.validate = function() {
        thisFilter.missingNames = [];
        var filterBoxId = "#" + thisFilter.id;

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
        // console.log("filterBoxId", filterBoxId);
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
    Object.keys(thisFilter.options).forEach(function(thisOptionName) { thisForm.drawOption(thisOptionName); });

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
    this.id = this.name.replace(/[\s,()/]/g, "");
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
        this.display.id = this.id + "-used";
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
        this.display.id = this.id + "-selected";
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
        this.box.id = this.id;
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
var bedrooms = new SearchFilter("Bedrooms");
bedrooms.options = {
    "numOfBeds": {
        "tag": "# of beds",
        "choices": ["Studio", "Convertible", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    "moreOrLess": {
        "choices": ["Exactly", "Or More", "Or Less"]
    }
};

var bathrooms = new SearchFilter("Bathrooms");
bathrooms.options = {
    "numOfBaths": {
        "tag": "# of baths",
        "choices": [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5]
    },
    "moreOrLess": {
        "choices": ["Exactly", "Or More", "Or Less"]
    }
};

var rent = new SearchFilter("Rent");
rent.options = {
    "min": {
        "tag": "Minimum",
        "choices": ["[TEXT]"]
    },
    "max": {
        "tag": "Maximum",
        "choices": ["[TEXT]"]
    }
};

var sqft = new SearchFilter("Square Footage");
sqft.options = {
    "min": {
        "tag": "Minimum",
        "choices": ["[TEXT]"]
    },
    "max": {
        "tag": "Maximum",
        "choices": ["[TEXT]"]
    }
};

var zip = new SearchFilter("ZIP Code");
zip.options = {
    "zip": {
        "tag": "ZIP Code",
        "choices": ["[TEXT]"]
    }
};

var mlsId = new SearchFilter("MLS ID");
mlsId.options = {
    "mlsId": {
        "tag": "MLS ID",
        "choices": ["[TEXT]"]
    }
};

var rbId = new SearchFilter("Rental Beast ID");
rbId.options = {
    "mlsId": {
        "tag": "RB ID",
        "choices": ["[TEXT]"]
    }
};

var listingAgent = new SearchFilter("Listing Agent");
listingAgent.options = {
    "listingAgent": {
        "tag": "Listing Agent",
        "choices": ["[TEXT]"]
    }
};

var doorman = new SearchFilter("Doorman");
doorman.options = {
    "listingAgent": {
        "tag": "Has a doorman",
        "choices": []
    }
};

var elevator = new SearchFilter("Elevator");
elevator.options = {
    "elevator": {
        "tag": "Has an elevator",
        "choices": []
    }
};

var fitnessCenter = new SearchFilter("Fitness Center");
fitnessCenter.options = {
    "fitnessCenter": {
        "tag": "Has a fitness center",
        "choices": []
    }
};

var pool = new SearchFilter("Pool");
pool.options = {
    "pool": {
        "tag": "Has a swimming pool",
        "choices": []
    }
};

var utilitiesIncluded = new SearchFilter("Utilities Included");
utilitiesIncluded.options = {
    "utilitiesIncluded": {
        "tag": "Utilities are included",
        "choices": []
    }
};

var sundeck = new SearchFilter("Sundeck / Grills");
sundeck.options = {
    "sundeck": {
        "tag": "Has a sundeck or grills",
        "choices": []
    }
};

var wheelchair = new SearchFilter("Wheelchair Accessible");
wheelchair.options = {
    "wheelchair": {
        "tag": "Is wheelchair accessible",
        "choices": []
    }
};

var furnished = new SearchFilter("Furnished");
furnished.options = {
    "furnished": {
        "tag": "Is furnished",
        "choices": []
    }
};

var photos = new SearchFilter("Photos");
photos.options = {
    "photos": {
        "tag": "Has Photos",
        "choices": []
    }
};

var deleaded = new SearchFilter("Deleaded");
deleaded.options = {
    "deleaded": {
        "tag": "Has been deleaded",
        "choices": []
    }
};

var shortterm = new SearchFilter("Short Term Lease");
shortterm.options = {
    "shortterm": {
        "tag": "Is a short term lease",
        "choices": []
    }
};

var mlsListings = new SearchFilter("MLS Listings");
mlsListings.options = {
    "mlslistings": {
        "choices": ["Only MLS Listings", "Exclude MLS Listings", "Agency Exclusives Only"]
    }
};

var ownerPays = new SearchFilter("Owner Pays");
ownerPays.options = {
    "yes": {
        "tag": "Yes",
        "choices": []
    },
    "negotiable": {
        "tag": "Negotiable",
        "choices": []
    },
    "cobroke": {
        "tag": "Co-broke",
        "choices": []
    },
    "no": {
        "tag": "No",
        "choices": []
    }
};

var statusOfListings = new SearchFilter("Status");
statusOfListings.options = {
    "active": {
        "tag": "Active Listings",
        "choices": []
    },
    "pending": {
        "tag": "Listings with applications pending",
        "choices": []
    },
    "rented": {
        "tag": "Rented Listings",
        "choices": []
    }
};

var ownershipType = new SearchFilter("Ownership Type (MC/PO)");
ownershipType.options = {
    "ownershipType": {
        "tag": "Ownership Type",
        "choices": ["Management Company (MC)", "Private Owner (PO)"]
    }
};

var parking = new SearchFilter("Parking");
parking.options = {
    "offstreet": {
        "tag": "Off Street Parking",
        "choices": []
    },
    "onstreet": {
        "tag": "On Street Parking",
        "choices": []
    },
    "coveredfee": {
        "tag": "Covered Parking for an Additional Fee",
        "choices": []
    },
    "covered": {
        "tag": "Covered Parking",
        "choices": []
    },
    "shared": {
        "tag": "Shared Driveway",
        "choices": []
    },
    "other": {
        "tag": "Other",
        "choices": []
    }
};

var pets = new SearchFilter("Pets");
pets.options = {
    "dog": {
        "tag": "Dogs Allowed",
        "choices": []
    },
    "cat": {
        "tag": "Cats Allowed",
        "choices": []
    },
    "other": {
        "tag": "Other types of pets allowed",
        "choices": []
    }
};

var buildingType = new SearchFilter("Building Type");
buildingType.options = {
    "onefamily": {
        "tag": "1 Family",
        "choices": []
    },
    "twofamily": {
        "tag": "2 Family",
        "choices": []
    },
    "threefamily": {
        "tag": "3 Family",
        "choices": []
    },
    "fourfamily": {
        "tag": "4 Family",
        "choices": []
    },
    "brownstone": {
        "tag": "Brownstone",
        "choices": []
    },
    "condo": {
        "tag": "Condo",
        "choices": []
    },
    "duplex": {
        "tag": "Duplex",
        "choices": []
    },
    "highrise": {
        "tag": "High Rise",
        "choices": []
    },
    "midrise": {
        "tag": "Mid-Rise",
        "choices": []
    },
    "ranch": {
        "tag": "Ranch",
        "choices": []
    },
    "rowhouse": {
        "tag": "Rowhouse",
        "choices": []
    },
    "townhouse": {
        "tag": "Townhouse / Townhome",
        "choices": []
    },
    "victorian": {
        "tag": "Victorian",
        "choices": []
    },
    "walkup": {
        "tag": "Walkup",
        "choices": []
    }
};

var proxToPublicTransit = new SearchFilter("Proximity to Public Transit");
proxToPublicTransit.options = {
    "within": {
        "tag": "Within",
        "choices": ["0.01mi","0.05mi","0.1mi","0.25mi","0.5mi","0.75mi","1mi","1.5mi","2mi","5mi","10mi"]
    },
    "type": {
        "tag": "Type",
        "choices": ["Bus","Subway","Rail","Other"]
    }
};

var searchCriteria = {
    "Rent": {
        "min": 2000
    }
};

// Run all the basic filters' draw box functions
var runDrawBoxes = function(filterGiven) {

    if (searchCriteria[filterGiven.id]) {
        var setState = function(thisChoiceName) {
            searchFilters[filterGiven.id].options[thisChoiceName].state = searchCriteria[filterGiven.id][thisChoiceName];
        };
        Object.keys(searchCriteria[filterGiven.id]).forEach(setState);
        filterGiven.drawUsed();
        filterGiven.selected = true;
    }

    if (!filterGiven.selected)
        filterGiven.drawUnselected();
    else
        filterGiven.drawSelected();
};
Object.values(searchFilters).forEach(runDrawBoxes);
// sortFilters();
