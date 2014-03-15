var Q = Quintus({development: true})
    .include("Sprites,Scenes,Input,Touch,UI");

Q.setup("myGame").touch(Q.SPRITE_ALL);

Q.MAIN_STAGE = 0;
Q.INVENTORY_STAGE = 1;
Q.UI_STAGE = 2;

Q.currLabelItem = null;
Q.currMessageItem = null;
Q.currMenuItem = null;
Q.currUseItem = null;

Q.VIEW_LABEL = "View";
Q.TAKE_LABEL = "Take";
Q.MANIPULATE_LABEL = "Manipulate";
Q.ENTER_LABEL = "Enter";
Q.USE_ITEM_LABEL = "Use item with...";
Q.USE_ITEM_HELP_MESSAGE = "Select an item from the screen.";
Q.USE_ITEM_NOSUCCESS_MESSAGE = "I don't know how to do this.";
Q.MANIPULATE_MESSAGE = "I don't know what to do with this.";


Q.Sprite.extend("Background", {
    init: function (p) {
        this._super(p, {type: Q.SPRITE_NONE,
                        collisionMask: Q.SPRITE_NONE,
                        x: 360, y: 288, z: -1000});
    }
});


Q.Class.extend("Room", {
    init: function (background, items, exit_left, exit_right) {
        var i = 0;
        this.background = background;
        this.items = items;
        this.exit_left = exit_left;
        this.exit_right = exit_right;
        for (i = 0; i < this.items.length; i++) {
            this.items[i].room = this;
        }
    },

    stage: function () {
        var that = this, i = 0;
        Q.clearStage(Q.UI_STAGE);
        Q.currLabelItem = null;
        Q.currMenuItem = null;
        Q.currMessageItem = null;

        Q.scene("Room", function (stage) {
            stage.insert(that.background);
            for (i = 0; i < that.items.length; i++) {
                stage.insert(that.items[i]);
            }
            if (that.exit_left) {
                stage.insert(new Q.Exit("LEFT", that.exit_left.label,
                                        that.exit_left.target));
            }
            if (that.exit_right) {
                stage.insert(new Q.Exit("RIGHT", that.exit_left.label,
                                        that.exit_left.target));
            }
        });
        Q.stageScene("Room", Q.MAIN_STAGE);
    },

    toInventory: function (item) {
        Q.stage(Q.MAIN_STAGE).delGrid(item);
        item.p.scale = 40 / Math.max(item.p.w, item.p.h);
        item.p.x = 25 + 45 * Q("Item", Q.INVENTORY_STAGE).length;
        item.p.y = Q.height - 25;
        Q.stage(Q.INVENTORY_STAGE).insert(item);
        this._removeItem(item);
    },

    removeItem: function (item, force) {
        var i = 0;
        if (item.inInventory()) {
            var items = Q.stage(Q.INVENTORY_STAGE).items;
            for (i = 0; i < items.length; i++) {
                items[i].p.x = 25 + 45 * (i - 1);
            }
        }
        if (force) {
            Q.stage(Q.MAIN_STAGE).forceRemove(item);
            Q.stage(Q.INVENTORY_STAGE).forceRemove(item);
        } else {
            Q.stage(Q.MAIN_STAGE).remove(item);
            Q.stage(Q.INVENTORY_STAGE).remove(item);
        }
        this._removeItem(item);
    },

    insertItem: function (item) {
        Q.stage(Q.MAIN_STAGE).insert(item);
        this.items.push(item);
        item.room = this;
    },

    _removeItem: function (item) {
        var i = 0;
        item.room = null;
        for (i = 0; i < this.items.length; i++) {
            if (this.items[i] === item) {
                this.items.splice(i, 1);
                break;
            }
        }
    }
});


var insertLabel = function (labelText) {
    Q.scene("UI", function (stage) {
        var label = stage.insert(new Q.UI.Container({
            fill: "rgba(255,255,255,0.8)",
            border: 0,
            shadow: 0,
            x: Q.width / 2,
            y: 20,
            radius: 5
        }));

        stage.insert(new Q.UI.Text({
            label: labelText,
            color: "black",
            x: 0,
            y: 0,
            size: 18,
            weight: 400
        }), label);

        label.fit(5, 10);
    });
    Q.stageScene("UI", Q.UI_STAGE);
};


var hoverable_step = function (dt) {
    if (this.p.over) {
        if (!Q.currLabelItem && !Q.currMenuItem && Q.currMessageItem !== this) {
            insertLabel(this.p.name);
            Q.currLabelItem = this;
            Q.currMessageItem = null;
        }
        if (Q.currMessageItem != null && Q.currMessageItem !== this) {
            Q.clearStage(Q.UI_STAGE);
            Q.currMessageItem = null;
        }
    } else {
        if (Q.currLabelItem != null && Q.currLabelItem === this) {
            Q.clearStage(Q.UI_STAGE);
            Q.currLabelItem = null;
        }
    }
};


Q.UI.Button.extend("Exit", {
    init: function (direction, name, target) {
        var defaults = {
            fill: "rgba(255,255,255,0.8)",
            y: Q.height / 2,
            type: Q.SPRITE_DEFAULT
        };
        if (direction == "LEFT") {
            defaults.label = "\u25C0";
            defaults.x = 10;
        } else {
            defaults.label = "\u25B6";
            defaults.x = Q.width - 10;
        }
        this._super(defaults);
        this.callback = function () {
            target.stage();
            Q.clearStage(Q.UI_STAGE);
        };
        this.p.name = name;
    },

    step: hoverable_step

});


Q.UI.Text.extend("MenuItem", {
    init: function (p, callback) {
        this._super(p, { color: "black", size: 18, weight: 400});
        this.on("touchEnd", this, "push");
        this.callback = callback;
    },

    push: function () {
        this.p.frame = 0;
        if (this.callback) { this.callback(); }
        this.trigger("click");
    }
});


Q.Sprite.extend("Item", {
    init: function (p) {
        this._super(p, { takeAllow: true,
                         takeAttempt: null,
                         manipulateAllow: true,
                         enter: null,
                         useCallbacks: null});
        this.on("touch");
    },

    inInventory: function () {
        return Q.stage(Q.INVENTORY_STAGE).items.indexOf(this) >= 0;
    },

    manipulateCallback: function () {
        insertLabel(Q.MANIPULATE_MESSAGE);
        Q.currMessageItem = this;
    },

    useCallback: function () {
        insertLabel(Q.USE_ITEM_HELP_MESSAGE);
        Q.currMessageItem = this;
        Q.currUseItem = this;
    },

    useWith: function (item) {
        var i = 0, cb = null;
        if (this.p.useCallbacks) {
            for (i = 0; i < this.p.useCallbacks.length; i++) {
                cb = this.p.useCallbacks[i];
                if (cb[0] === item) {
                    cb[1](this, item);
                    return;
                }
            }
        }
        insertLabel(Q.USE_ITEM_NOSUCCESS_MESSAGE);
        Q.currMessageItem = item;
    },

    drawMenu: function (touch) {
        var that = this;
        Q.scene("UI", function (stage) {
            var menu = stage.insert(new Q.UI.Container({
                fill: "rgba(255,255,255,0.8)",
                border: 0,
                shadow: 0,
                x: touch.x,
                y: touch.y,
                radius: 5
            }));

            var y = 0;

            var txt = stage.insert(new Q.MenuItem(
                { label: Q.VIEW_LABEL, x: 0, y: y },
                function () {
                    Q.clearStage(Q.UI_STAGE);
                    insertLabel(that.p.description);
                    Q.currMessageItem = that;
                    Q.currMenuItem = null;
                }), menu);

            y += txt.p.h;

            if ((that.p.takeAllow || that.p.takeAttempt) && !that.inInventory()) {
                txt = stage.insert(new Q.MenuItem(
                    { label: Q.TAKE_LABEL, x: 0, y: y },
                    function () {
                        Q.clearStage(Q.UI_STAGE);
                        Q.currMenuItem = null;
                        if (that.p.takeAllow) {
                            that.room.toInventory(that);
                        } else {
                            insertLabel(that.p.takeAttempt);
                            Q.currMessageItem = that;
                        }
                    }), menu);
                y += txt.p.h;
            }


            if (that.p.manipulateAllow) {
                txt = stage.insert(new Q.MenuItem(
                    { label: Q.MANIPULATE_LABEL, x: 0, y: y },
                    function () {
                        Q.clearStage(Q.UI_STAGE);
                        Q.currMenuItem = null;
                        that.manipulateCallback();
                    }), menu);
                y += txt.p.h;
            }

            if (that.inInventory()) {
                txt = stage.insert(new Q.MenuItem(
                    { label: Q.USE_ITEM_LABEL, x: 0, y: y },
                    function () {
                        Q.clearStage(Q.UI_STAGE);
                        Q.currMenuItem = null;
                        that.useCallback();
                    }), menu);
                y += txt.p.h;
            }

            if (that.p.enter) {
                txt = stage.insert(new Q.MenuItem(
                    { label: Q.ENTER_LABEL, x: 0, y: y },
                    function () { that.p.enter.stage(); }
                ), menu);
                y += txt.p.h;
            }

            menu.fit(5, 10);
            menu.p.y = Math.min(Q.height - y, menu.p.y);
            menu.p.x = Math.max(menu.p.x, menu.p.w / 2);
            menu.p.x = Math.min(menu.p.x, Q.width - menu.p.w / 2);
        });

        Q.stageScene("UI", Q.UI_STAGE);
    },

    touch: function (touch) {
        Q.clearStage(Q.UI_STAGE);
        Q.currLabelItem = null;
        Q.currMessageItem = null;
        if (Q.currUseItem) {
            Q.currUseItem.useWith(this);
            Q.currUseItem = null;
        } else {
            Q.currMenuItem = this;
            this.drawMenu(touch);
        }
    },

    step: hoverable_step
});


var currentObj = null;

Q.el.addEventListener("mousemove", function (e) {
    var x = e.offsetX || e.layerX, y = e.offsetY || e.layerY;
    var stage = Q.stage(Q.MAIN_STAGE);
    var stageX = Q.canvasToStageX(x, stage);
    var stageY = Q.canvasToStageY(y, stage);
    var obj = stage.locate(stageX, stageY, Q.SPRITE_DEFAULT);

    if (!obj) {
        stage = Q.stage(Q.INVENTORY_STAGE);
        stageX = Q.canvasToStageX(x, stage);
        stageY = Q.canvasToStageY(y, stage);
        obj = stage.locate(stageX, stageY, Q.SPRITE_DEFAULT);
    }

    if (currentObj) { currentObj.p.over = false; }
    if (obj) {
        currentObj = obj;
        obj.p.over = true;
    } else {
        Q.currMessageItem = null;
    }
});


Q.el.addEventListener("mousedown", function (e) {
    var x = e.offsetX || e.layerX, y = e.offsetY || e.layerY;
    var stage = Q.stage();
    var stageX = Q.canvasToStageX(x, stage);
    var stageY = Q.canvasToStageY(y, stage);
    var obj = stage.locate(stageX, stageY, Q.SPRITE_DEFAULT);

    if (!obj && Q.stage(Q.UI_STAGE)) {
        stage = Q.stage(Q.UI_STAGE);
        stageX = Q.canvasToStageX(x, stage);
        stageY = Q.canvasToStageY(y, stage);
        obj = stage.locate(stageX, stageY, Q.SPRITE_UI);
    }

    if (!obj && Q.stage(Q.UI_STAGE)) {
        Q.clearStage(Q.UI_STAGE);
        Q.currMenuItem = null;
        Q.currLabelItem = null;
        Q.currMessageItem = null;
    }
});
