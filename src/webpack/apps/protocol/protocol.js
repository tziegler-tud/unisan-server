import {MDCRipple} from '@material/ripple';
$(document).ready (function () {

  const dropdowns = [].map.call(document.querySelectorAll(".dropdown-button"), function (el) {
    var token = lidlRTO.objectManager.createNewObjectToken();
    const container = $(el).closest(".dropdown-menu");
    const drop = new common.DropdownMenu(container, "click", el);
    lidlRTO.objectManager.addObject(drop, token);
  });

  //register item links
  $(".protocol-item").on("click", function(){
    const viewkey = this.dataset.viewkey;
    let url ="/unisams/apps/protocol/protocol-editor?viewkey="+viewkey;
    window.open(url, '_blank').focus();
  })

  //register add btn
  $(".protocol-add").on("click", function(){
    const jsonData = {
      title: "test2"
    }
    $.ajax({
      url: "/api/v1/apps/protocol/create",
      type: 'POST',
      contentType: "application/json; charset=UTF-8",
      dataType: 'json',
      data: JSON.stringify(jsonData),
      success: function(result) {
        location.reload();
      }
    });
  })

  const deleteContent = {
    title: "Protokoll löschen",
    message: "U sure bro?",
    titleArg: "",
    messageArg: ""
  };

  var deleteArgs = {
    callback: {
      onConfirm: function (result) {
        let id = result.event.target.dataset.id
        // build a json object or do something with the form, store in data
        $.ajax({
          url: "/api/v1/apps/protocol/" + id,
          type: 'DELETE',
          success: function(result) {
            window.location.replace("/unisams/apps/protocol");
          }
        });
      }
    }
  };

  const dialogs = [].map.call(document.querySelectorAll(".documentDeleteBtn"), function (el) {
    var token = lidlRTO.objectManager.createNewObjectToken();
    const dialogDeleteProtocol = new lidl.Dialog(token, el, 'confirmDelete', deleteContent, deleteArgs);
    lidlRTO.objectManager.addObject(dialogDeleteProtocol, token);
  });

  const selector = '.mdc-icon-button';
  const ripples = [].map.call(document.querySelectorAll(selector), function (el) {
    return new MDCRipple(el);

  });

});
