<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Studentischer Sanitätsdienst der TU Dresden</title>
    <link rel="shortcut icon" type="image/x-icon" href="icons/favicon.ico">

    <script src="src/js/index/config.js"></script>

    <?php include_once("common-includes.php"); ?>

       <!--
         ***********************************
         ** specific js libs
         *********************************** -->

         <script src="src/js/index/init.js"></script>
         <script src="src/js/index/index.js"></script>
     


       <!--
         ***********************************
         ** specific css files
         *********************************** -->
       <link rel="stylesheet" type="text/css" href="src/css/lssc_loader_index.css" />

</head>
<body>

<!--Preloader-->
<?php include_once("preloader.html");?>

<!-- content-->

<?php include_once("nav.html"); ?>
<div id="wrapper" class="content-wrapper">

<?php include_once("index-snippet.html"); ?>
<?php include_once("footer.html"); ?>

</div>

<?php include_once("floating_btn.html"); ?>
</body>
</html>
