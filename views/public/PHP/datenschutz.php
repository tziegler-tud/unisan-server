<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Datenschutz - Studentischer Sanitätsdienst der TU Dresden</title>
    <link rel="shortcut icon" type="image/x-icon" href="icons/favicon.ico">


    <?php include_once("common-includes.php"); ?>

           <!--
             ***********************************
             ** specific js libs
             *********************************** -->

           <script src="src/js/contact/init.js"></script>


           <!--
             ***********************************
             ** specific css files
             *********************************** -->
           <link rel="stylesheet" type="text/css" href="src/css/lssc_loader_impressum.css" />

</head>

<!--Preloader-->
<?php include_once("preloader.html");?>

<!-- no js dash -->
<div id="no-js-dash">
    <div id="no-js-text">
        <span>Sie haben Javascript in ihrem Browser deaktiviert. Aktivieren Sie Javascript, um alle Funktionen der Website nutzen zu können.</span>
    </div>
</div>

<!-- content-->

<?php include_once("nav.html"); ?>


<?php include_once("datenschutz.html"); ?>

<?php include_once("footer.html"); ?>

<?php include_once("floating_btn.html"); ?>


</body>
</html>