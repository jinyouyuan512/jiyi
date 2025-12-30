CREATE TABLE `assets_3d` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('glb','gltf','fbx','obj') NOT NULL DEFAULT 'glb',
	`url` text NOT NULL,
	`thumbnail` text,
	`fileSize` int,
	`polygonCount` int,
	`relatedAttractionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assets_3d_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oral_histories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`interviewee` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`coverImage` text NOT NULL,
	`mediaType` enum('audio','video') NOT NULL DEFAULT 'audio',
	`mediaUrl` text NOT NULL,
	`content` text,
	`duration` int NOT NULL,
	`relatedArtifactId` int,
	`viewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `oral_histories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ue_instances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceId` varchar(100) NOT NULL,
	`signalingUrl` text NOT NULL,
	`status` enum('idle','busy','offline') NOT NULL DEFAULT 'idle',
	`currentUserId` int,
	`lastHeartbeat` timestamp NOT NULL DEFAULT (now()),
	`region` varchar(50) DEFAULT 'cn-north-1',
	CONSTRAINT `ue_instances_id` PRIMARY KEY(`id`),
	CONSTRAINT `ue_instances_instanceId_unique` UNIQUE(`instanceId`)
);
--> statement-breakpoint
ALTER TABLE `assets_3d` ADD CONSTRAINT `assets_3d_relatedAttractionId_attractions_id_fk` FOREIGN KEY (`relatedAttractionId`) REFERENCES `attractions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `oral_histories` ADD CONSTRAINT `oral_histories_relatedArtifactId_artifacts_id_fk` FOREIGN KEY (`relatedArtifactId`) REFERENCES `artifacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ue_instances` ADD CONSTRAINT `ue_instances_currentUserId_users_id_fk` FOREIGN KEY (`currentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;