 <?php

        $name = $_POST["nameInp"];
        $col1 = $_POST["colorInput1a"];
        $col2 = $_POST["colorInput2a"];
        $col3 = $_POST["colorInput2b"];
        $col4 = $_POST["colorInput3a"];
        $col5 = $_POST["colorInput3b"];
        $col6 = $_POST["colorInput4a"];
        $col7 = $_POST["colorInput4b"];

        $test1 = 'testTest';

      $servername = 'localhost';
      $username = "web93";
      $password = "un!s4n.cms";
      $dbname = 'usr_web93_1';

    // Create connection
    $conn =  mysql_connect($servername, $username, $password, $dbname);
    $db_handle = mysql_connect($servername, $username, $password);
    $db_found = mysql_select_db($dbname, $db_handle);


    // Create connection
    $conn = new mysqli($servername, $username, $password);

    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    //echo "Connected successfully";

    $sql = "INSERT INTO `usr_web93_1`.`color` (`name`, `col1`, `col2`, `col3`, `col4`, `col5`, `col6`, `col7`) VALUES ('{$name}', '{$col1}', '{$col2}', '{$col3}', '{$col4}', '{$col5}', '{$col6}', '{$col7}')";
    if (mysqli_query($conn, $sql)) {
        //echo "New record created successfully";
        mysqli_close($conn);
        echo '<script>window.location.href = "index.php";</script>';
        exit;
    } else {
        echo "Error: " . $sql . "<br>" . mysqli_error($conn);
        mysqli_close($conn);

    }




    ?>