import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  image: string;
  overlayColor?: string;
  height?: string;
}

export default function PageHeader({ 
  title, 
  description, 
  image, 
  overlayColor = "from-black/60 to-background",
  height = "h-[40vh]"
}: PageHeaderProps) {
  return (
    <section className={`relative w-full ${height} overflow-hidden flex items-center justify-center`}>
      {/* Background Image with Parallax Effect */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5 }}
      >
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-b ${overlayColor}`}></div>
      </motion.div>

      {/* Content */}
      <div className="container relative z-10 text-center text-white space-y-4 pt-10">
        <motion.h1 
          className="text-4xl md:text-6xl font-serif font-bold tracking-tight drop-shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p 
            className="text-lg md:text-xl font-light opacity-90 max-w-2xl mx-auto tracking-wide drop-shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {description}
          </motion.p>
        )}
      </div>
    </section>
  );
}
