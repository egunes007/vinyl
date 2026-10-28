<?php
defined('ABSPATH') || exit;
if (vinyl_archive_view() !== 'content') {
    get_header();
    get_template_part('template-parts-archive');
    get_footer();
} else {
    get_template_part('index');
}
