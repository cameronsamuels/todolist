// Cameron Samuels

const fs = require("fs");

window.lists = {};

window.addEventListener("DOMContentLoaded", () => {

  function writeJson(file, json) {
    fs.writeFileSync(file + ".json", JSON.stringify(json));
  }

  function updateListJson(list) {
    let copy = JSON.parse(JSON.stringify(lists[list]));
    for (const i of copy) {
      delete i.list;
      delete i.el;
      delete i.id;
    }
    let x = { "items": copy }
    writeJson(list, x);
  }

  function ListItem(list, json) {
    this.list = list;
    this.id = lists[list].length;
    this.checked = json.checked || false;
    this.title = json.title || "Task";
    this.due = json.due;
    this.priority = json.priority || 0;
    this.description = json.description || "";

    let listItem = this;
    this.el = {};

    this.el.container = document.createElement("li");
    this.el.container.className = "list-item" + (this.checked ? " checked" : "");

    this.el.check = document.createElement("input");
    this.el.check.setAttribute("type", "checkbox");
    this.el.check.checked = this.checked;
    this.el.check.addEventListener("change", function() {
      listItem.setChecked(this.checked);
    });

    this.el.title = document.createElement("span");
    this.el.title.className = "list-item-title";
    this.el.title.textContent = this.title;
    this.el.title.setAttribute("contenteditable", true);
    this.el.title.addEventListener("blur", function() {
      listItem.setTitle(this.textContent);
    });

    this.el.priority = document.createElement("div");
    this.el.priority.className = "list-item-priority";
    this.el.priority.textContent = "";
    for (let k = 0; k < this.priority; k++)
      this.el.priority.textContent += "!";
    this.el.priority.addEventListener("click", function() {
      let x = parseInt(this.textContent.length);
      x = x >= 3 ? 0 : x + 1;
      listItem.setPriority(x);
    });

    this.el.delete = document.createElement("div");
    this.el.delete.className = "list-item-delete";
    this.el.delete.textContent = "X";
    this.el.delete.addEventListener("click", function() {
      listItem.delete();
    });

    this.el.details = document.createElement("div");
    this.el.details.className = "list-item-details";

    this.el.due = document.createElement("input");
    this.el.due.className = "list-item-due";
    if (new Date() > new Date(this.due))
      this.el.due.classList.add("overdue");
    this.el.due.setAttribute("type", "date");
    this.el.due.value = this.due;
    this.el.due.addEventListener("change", function() {
      listItem.setDue(this.value);
    });

    this.el.description = document.createElement("p");
    this.el.description.className = "list-item-description";
    this.el.description.textContent = this.description;
    this.el.description.setAttribute("contenteditable", true);
    this.el.description.addEventListener("blur", function() {
      listItem.setDescription(this.textContent);
    });

    this.el.container.appendChild(this.el.check);
    this.el.container.appendChild(this.el.title);
    this.el.container.appendChild(this.el.priority);
    this.el.container.appendChild(this.el.delete);
    this.el.container.appendChild(this.el.details);
    this.el.details.appendChild(this.el.due);
    this.el.details.appendChild(this.el.description);
    document.querySelector(".list").appendChild(this.el.container);
  }

  ListItem.prototype.setChecked = function(x) {
    this.checked = x;
    this.el.check.checked = x;
    if (this.checked) this.el.container.classList.add("checked");
    else this.el.container.classList.remove("checked");
    updateListJson(this.list);
    sortList();
  }

  ListItem.prototype.setTitle = function(x) {
    this.title = x;
    this.el.title.textContent = x;
    updateListJson(this.list);
    sortList();
  }

  ListItem.prototype.setPriority = function(x) {
    this.priority = x;
    this.el.priority.textContent = "";
    for (let k = 0; k < this.priority; k++)
      this.el.priority.textContent += "!";
    updateListJson(this.list);
  }

  ListItem.prototype.setDue = function(x) {
    this.due = x;
    this.el.due.value = x;
    if (new Date() > new Date(this.due))
      this.el.due.classList.add("overdue");
    else this.el.due.classList.remove("overdue");
    updateListJson(this.list);
    sortList();
  }

  ListItem.prototype.setDescription = function(x) {
    this.description = x;
    this.el.description.textContent = x;
    updateListJson(this.list);
  }

  ListItem.prototype.delete = function() {
    lists[this.list].splice(lists[this.list].indexOf(this), 1);
    this.el.container.remove();
    let listItem = this;
    setTimeout(function() {
      updateListJson(listItem.list);
    }, 100);
  }

  function renderList(name, items) {
    let el = document.createElement("ul");
    el.className = "list";
    document.body.appendChild(el);

    items.sort(function(a, b) {
      if (a.checked && !b.checked) return 1;
      if (b.checked && !a.checked) return -1;
      if (!a.due && b.due) return 1;
      if (!b.due && a.due) return -1;
      let ad = new Date(a.due);
      let bd = new Date(b.due);
      if (ad < bd)
        return -1;
      if (ad > bd)
        return 1;
      if (a.title.toLowerCase() < b.title.toLowerCase())
        return -1;
      if (a.title.toLowerCase() > b.title.toLowerCase())
        return 1;
      return 0;
    });
    for (const i of items) {
      lists[name].push(new ListItem(name, i));
    }

    if (document.querySelector(".clear-checked-items"))
      document.querySelector(".clear-checked-items").remove();
    let clearBtn = document.createElement("div");
    clearBtn.className = "clear-checked-items";
    clearBtn.textContent = "Clear Checked Items";
    clearBtn.addEventListener("click", function() {
      for (let i = lists[name].length - 1; i >= 0; i--)
        if (lists[name][i].checked)
          lists[name].splice(i, 1);
      updateListJson(name);
      sortList();
    })
    document.body.appendChild(clearBtn);

    if (document.querySelector(".delete-list"))
      document.querySelector(".delete-list").remove();
    let deleteBtn = document.createElement("div");
    deleteBtn.className = "delete-list";
    deleteBtn.textContent = "Remove List";
    deleteBtn.addEventListener("click", function() {
      fs.readFile("lists.json", "utf8", function (err, data) {
        let x = JSON.parse(data).lists;
        x.splice(x.indexOf(window.location.hash.substring(1)), 1);
        if (x.length == 0) {
          x = ["Main"];
          window.location.reload();
        }
        writeJson("lists", {"lists": x});
        window.location.hash = "#" + x[0];
        document.querySelector(".tabs").remove();
        createTabs(x);
      });
    });
    document.body.appendChild(deleteBtn);
  }

  function readList(id) {
    fs.readFile(id + ".json", "utf8", function (err, data) {
      if (err) return console.log(err);
      let json = JSON.parse(data);
      if (!json.items) {
        json.items = [];
        writeJson(id, json);
      }
      lists[id] = [];
      renderList(id, json.items);
    });
  }

  function sortList() {
    if (document.querySelector(".list"))
      document.querySelector(".list").remove();
    readList(window.location.hash.substring(1));
  }

  function hashChange() {
    let hash = window.location.hash.substring(1);
    if (document.querySelector(".list"))
      document.querySelector(".list").remove();
    if (!fs.existsSync(hash + ".json"))
      fs.writeFileSync(hash + ".json", '{"items":[{"title":"Homework","due":"2021-02-22","description":"Computer Science Project"}]}');
    readList(hash);

    if (document.querySelector(".create-list-item"))
      document.querySelector(".create-list-item").remove();
    let el = document.createElement("div");
    el.className = "create-list-item";
    el.textContent = "+";
    el.addEventListener("click", function() {
      window.lists[hash].push(new ListItem(hash, {}));
      updateListJson(hash);
    });
    document.body.appendChild(el);
  }
  window.addEventListener("hashchange", hashChange);

  function createTabs(lists) {
    let container = document.createElement("div");
    container.className = "tabs";
    for (const i of lists) {
      let el = document.createElement("a");
      el.setAttribute("href", "#" + i);
      el.setAttribute("id", i);
      el.textContent = i;
      container.appendChild(el);
    }

    let createBtn = document.createElement("a");
    createBtn.className = "create-list";
    createBtn.addEventListener("click", function() {
      let x = [];
      for (i of lists)
        x.push(i);
      
      let el = document.createElement("a");
      el.setAttribute("contenteditable", "true");
      el.textContent = "__";
      el.focus();
      let clickEvent = function() {
        el.textContent = "";
      };
      let blurEvent = function() {
        let y = this.textContent;
        x.push(y);
        writeJson("lists", {"lists": x});
        el.setAttribute("href", "#" + y);
        el.setAttribute("id", y);
        el.removeAttribute("contenteditable");
        el.removeEventListener("click", clickEvent);
        el.removeEventListener("blur", blurEvent);
      }
      el.addEventListener("click", clickEvent);
      el.addEventListener("blur", blurEvent);
      container.insertBefore(el, document.querySelector(".create-list"))
    });
    createBtn.textContent = "+";
    container.appendChild(createBtn);
    document.body.appendChild(container);
  }

  if (!fs.existsSync("lists.json"))
    fs.writeFileSync("lists.json", '{"lists":["main"]}');
    
  fs.readFile("lists.json", "utf8", function (err, data) {
    if (err) return console.log(err);
    let lists = JSON.parse(data).lists;
    createTabs(lists);
    if (!window.location.hash)
      window.location.hash = lists[0];
    else hashChange();
  });

})
