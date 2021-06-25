var $ = function (sel) {
    return document.querySelector(sel);
};

var $All = function (sel) {
    return document.querySelectorAll(sel);
};

var makeArray = function (likeArray) {
    var array = [];
    for (var i = 0; i < likeArray.length; ++i) {
        array.push(likeArray[i]);
    }
    return array;
};

var guid = 0;
var CL_COMPLETED = 'completed';
var CL_SELECTED = 'selected';
var CL_EDITING = 'editing';
var CL_CHECKED = 'checked'

function update() {
    model.flush();
    var data = model.data;

    var activeCount = 0;
    var todoList = $('.todo-list');
    todoList.innerHTML = '';
    data.items.forEach(function (itemData, index) {
        if (!itemData.completed) activeCount++;

        if (
            data.filter == 'All'
            || (data.filter == 'Active' && !itemData.completed)
            || (data.filter == 'Completed' && itemData.completed)
        ) {
            var item = document.createElement('li');
            var id = 'item' + guid++;
            item.setAttribute('id', id);
            if (itemData.completed) item.classList.add(CL_COMPLETED);
            item.innerHTML = [
                '<div class="view">',
                '  <div class="toggle"><input type="checkbox"></div>',
                '  <div class="todo-label">' + itemData.msg + '</div>',
                '</div>'
            ].join('');

            var divDestroy = document.createElement('div');
            divDestroy.className = 'destroy';
            divDestroy.innerHTML = 'delete';
            divDestroy.addEventListener('click', function () {
                data.items.splice(index, 1);
                update();
            }, false);

            var itemView = item.querySelector('.view');
            var itemViewHaveDestroy = false;

            var label = item.querySelector('.todo-label');
            label.addEventListener('click', function () {
                item.classList.add(CL_EDITING);

                var edit = document.createElement('input');
                var finished = false;
                edit.setAttribute('type', 'text');
                edit.setAttribute('class', 'edit');
                edit.setAttribute('value', label.innerHTML);

                function finish() {
                    if (finished) return;
                    finished = true;
                    itemView = item.querySelector('.view')
                    itemView.removeChild(edit);
                    item.classList.remove(CL_EDITING);
                }

                edit.addEventListener('blur', function () {
                    finish();
                }, false);

                edit.addEventListener('keyup', function (ev) {
                    if (ev.key == 'Enter') {// Enter
                        label.innerHTML = this.value;
                        itemData.msg = this.value;
                        update();
                    }
                }, false);

                if (itemViewHaveDestroy) {
                    label.setAttribute('class', 'todo-label');
                    itemView.removeChild(divDestroy);
                    itemViewHaveDestroy = false;
                }
                itemView.appendChild(edit);
                edit.focus();
            }, false);

            var startTouch;
            var endTouch;
            var touchHandler = {
                start: function (ev) {
                    console.log(ev.type, ev);
                    startTouch = ev.touches[0];
                },
                end: function (ev) {
                    console.log(ev.type, ev);
                    endTouch = ev.changedTouches[0];
                    var itemx1 = item.offsetLeft;
                    var itemy1 = item.offsetTop;
                    var itemx2 = item.offsetLeft + item.offsetWidth;
                    var itemy2 = item.offsetTop + item.offsetHeight;
                    if (
                        startTouch.clientX < itemx1
                        || startTouch.clientX > itemx2
                        || startTouch.clientY < itemy1
                        || startTouch.clientY > itemy2
                        || endTouch.clientX < itemx1
                        || endTouch.clientX > itemx2
                        || endTouch.clientY < itemy1
                        || endTouch.clientY > itemy2
                    ) {
                        return;
                    }
                    if (startTouch.clientX < endTouch.clientX) {
                        if (!itemViewHaveDestroy) return;
                        label.setAttribute('class', 'todo-label');
                        itemView.removeChild(divDestroy);
                        itemViewHaveDestroy = false;
                    }
                    else if (startTouch.clientX > endTouch.clientX) {
                        if (itemViewHaveDestroy) return;
                        if (item.classList.contains(CL_EDITING)) return;
                        label.setAttribute('class', 'todo-label have-destroy')
                        itemView.appendChild(divDestroy);
                        itemViewHaveDestroy = true;
                    }

                }
            }
            item.addEventListener('touchstart', touchHandler.start)
            item.addEventListener('touchend', touchHandler.end)


            var itemToggle = item.querySelector('.toggle input');
            itemToggle.checked = itemData.completed;
            itemToggle.addEventListener('click', function () {
                itemData.completed = !itemData.completed;
                update();
            }, false);

            todoList.insertBefore(item, todoList.firstChild);
        }
    });

    var newTodo = $('.new-todo input');
    newTodo.value = data.msg;

    var completedCount = data.items.length - activeCount;
    var count = $('.todo-count');
    count.innerHTML = (activeCount || 'No') + (activeCount > 1 ? ' items' : ' item') + ' left';

    var clearCompleted = $('.clear-completed');
    clearCompleted.style.visibility = completedCount > 0 ? 'visible' : 'hidden';

    var toggleAll = $('.toggle-all');
    toggleAll.style.visibility = data.items.length > 0 ? 'visible' : 'hidden';
    if (data.items.length == completedCount)
        toggleAll.classList.add(CL_CHECKED);
    else
        toggleAll.classList.remove(CL_CHECKED);

    var filters = makeArray($All('.filters li a'));
    filters.forEach(function (filter) {
        if (data.filter == filter.innerHTML) filter.classList.add(CL_SELECTED);
        else filter.classList.remove(CL_SELECTED);
    });
}

window.onload = function () {
    model.init(function () {
        var data = model.data;

        var newTodo = $('.new-todo input');

        newTodo.addEventListener('keyup', function () {
            data.msg = newTodo.value;
        });

        newTodo.addEventListener('change', function () {
            model.flush();
        });

        newTodo.addEventListener('keyup', function (event) {
            if (event.key != 'Enter') return; // Enter

            if (data.msg == '') {
                console.warn('input msg is empty');
                return;
            }
            data.items.push({ msg: data.msg, completed: false });
            data.msg = '';
            update();
        }, false);

        var clearCompleted = $('.clear-completed');
        clearCompleted.addEventListener('click', function () {
            items = []
            data.items.forEach(function (itemData, index) {
                if (!itemData.completed)
                    items.push(data.items[index]);
            });
            data.items = items;
            update();
        }, false);

        var toggleAll = $('.toggle-all');
        toggleAll.addEventListener('click', function () {
            var completed = false;
            if (toggleAll.classList.contains(CL_CHECKED)) {
                toggleAll.classList.remove(CL_CHECKED);
                completed = false;
            }
            else {
                toggleAll.classList.add(CL_CHECKED);
                completed = true;
            }
            data.items.forEach(function (itemData) {
                itemData.completed = completed;
            });
            update();
        }, false);

        var filters = makeArray($All('.filters li a'));
        filters.forEach(function (filter) {
            filter.addEventListener('click', function () {
                data.filter = filter.innerHTML;
                filters.forEach(function (filter) {
                    filter.classList.remove(CL_SELECTED);
                });
                filter.classList.add(CL_SELECTED);
                update();
            }, false);
        });

        update();
    });
};