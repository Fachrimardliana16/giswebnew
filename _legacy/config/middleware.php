<?php
function checkSession() {
    if (!isset($_SESSION['user_id'])) {
        $_SESSION['error'] = 'Silakan login terlebih dahulu';
        header('Location: login.php');
        exit();
    }
}