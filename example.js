
//Q.debug = true;
//Q.debugFill = true;


Q.load(["red_circle.png", "village.png", "black_thingy.png", "bird.png",
        "door_closed.png", "door_open.png", "house.png", "frame_empty.png",
        "frame_with_circle.png"],
       function () {

           var frame_empty = new Q.Item(
               {x: 140, y: 220,
                asset: "frame_empty.png",
                name: "Frame",
                description: "An empty frame.",
                takeAllow: false, manipulateAllow: false});

           var frame_with_circle = new Q.Item(
               {x: 140, y: 220,
                asset: "frame_with_circle.png",
                name: "Frame",
                description: "A frame with a red circle. It looks very pretty.",
                takeAllow: false, manipulateAllow: false});

           var red_circle = new Q.Item(
               {x: 416, y: 466,
                asset: "red_circle.png",
                name: "Red circle",
                description: "A red circle. It looks pretty.",
                points: [[2 - 16, 11 - 16],
                         [1 - 16, 11 - 16],
                         [22 - 16, 2 - 16],
                         [30 - 16, 11 - 16],
                         [30 - 16, 22 - 16],
                         [23 - 16, 30 - 16],
                         [11 - 16, 30 - 16],
                         [2 - 16, 20 - 16]],
                useCallbacks: [
                    [frame_empty,
                     function (item, other) {
                         other.room.insertItem(frame_with_circle);
                         other.room.removeItem(item, true);
                         other.room.removeItem(other);
                         insertLabel("The circle looks very pretty inside the frame!");
                         Q.currMessageItem = frame_with_circle;
                     }]]});

           var black_thingy = new Q.Item(
               {x: 116, y: 416,
                asset: "black_thingy.png",
                name: "Black thing",
                description: "A mysterious black thing."});

           var bird = new Q.Item(
               {x: 360, y: 116,
                asset: "bird.png",
                name: "Bird",
                description: "A flying bird. I wonder were it's headed.",
                takeAllow: false, takeAttempt: "I can't catch the bird."});

           var door_closed = new Q.Item(
               {x: 273, y: 318,
                asset: "door_closed.png",
                name: "Door",
                description: "The door is closed.",
                takeAllow: false});

           var village = new Q.Room(
               new Q.Background({asset: "village.png"}),
               [red_circle, black_thingy, bird, door_closed]);

           var house = new Q.Room(
               new Q.Background({asset: "house.png"}),
               [frame_empty],
               {label: "Go outside", target: village});

           door_closed.manipulateCallback = function () {
               this.room.insertItem(new Q.Item(
                   {x: 273, y: 318, asset: "door_open.png", name: "Door",
                    description: "The door is open.", takeAllow: false,
                    manipulateAllow: false, enter: house}));
               this.room.removeItem(this);
           };

           village.stage();
           Q.stageScene(null, Q.INVENTORY_STAGE);
       },
       {
           progressCallback: function(loaded, total) {
               var element = document.getElementById("loading_progress");
               element.style.width = Math.floor(loaded / total * 100) + "%";
               if (loaded == total) {
                   var parent = document.getElementById("loading");
                   parent.parentNode.removeChild(parent);
               }
           }
       });
